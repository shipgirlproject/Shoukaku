import {IncomingMessage} from 'http';
import {NodeOption, Shoukaku, ShoukakuEvents} from '../Shoukaku';
import {OpCodes, ShoukakuClientInfo, State, Versions} from '../Constants';
import {TypedEventEmitter, wait} from '../Utils';
import {Rest} from './Rest';
import {
	PlayerUpdate,
	TrackEndEvent,
	TrackExceptionEvent,
	TrackStartEvent,
	TrackStuckEvent,
	WebSocketClosedEvent
} from '../guild/Player';
import Websocket from 'ws';

export interface Ready {
	op: OpCodes.READY;
	resumed: boolean;
	sessionId: string;
}

export interface NodeMemory {
	reservable: number;
	used: number;
	free: number;
	allocated: number;
}

export interface NodeFrameStats {
	sent: number;
	deficit: number;
	nulled: number;
}

export interface NodeCpu {
	cores: number;
	systemLoad: number;
	lavalinkLoad: number;
}

export interface Stats {
	op: OpCodes.STATS;
	players: number;
	playingPlayers: number;
	memory: NodeMemory;
	frameStats: NodeFrameStats | null;
	cpu: NodeCpu;
	uptime: number;
}

export interface NodeInfoVersion {
	semver: string;
	major: number;
	minor: number;
	patch: number;
	preRelease?: string;
	build?: string;
}

export interface NodeInfoGit {
	branch: string;
	commit: string;
	commitTime: number;
}

export interface NodeInfoPlugin {
	name: string;
	version: string;
}

export interface NodeInfo {
	version: NodeInfoVersion;
	buildTime: number;
	git: NodeInfoGit;
	jvm: string;
	lavaplayer: string;
	sourceManagers: string[];
	filters: string[];
	plugins: NodeInfoPlugin[];
}

export interface ResumableHeaders {
	[key: string]: string;
	'Client-Name': string;
	'User-Agent': string;
	'Authorization': string;
	'User-Id': string;
	'Session-Id': string;
}

export type NonResumableHeaders = Omit<ResumableHeaders, 'Session-Id'>;

export type NodeEvents = {
	[K in keyof ShoukakuEvents]: ShoukakuEvents[K] extends [unknown, ...infer R] ? R : never;
};

/**
 * Represents a Lavalink node
 */
export class Node extends TypedEventEmitter<NodeEvents> {
	/**
     * Shoukaku class
     */
	public readonly manager: Shoukaku;
	/**
     * Lavalink rest API
     */
	public readonly rest: Rest;
	/**
     * Name of this node
     */
	public readonly name: string;
	/**
     * Group in which this node is contained
     */
	public readonly group?: string;
	/**
     * URL of Lavalink
     */
	private readonly url: string;
	/**
     * Credentials to access Lavalink
     */
	private readonly auth: string;
	/**
     * The state of this connection
     */
	public state: State;
	/**
	 * The number of reconnects to Lavalink
	 */
	public reconnects: number;
	/**
     * Statistics from Lavalink
     */
	public stats: Stats | null;
	/**
     * Information about lavalink node
    */
	public info: NodeInfo | null;
	/**
     * Websocket instance
     */
	public ws: Websocket | null;
	/**
     * SessionId of this Lavalink connection (not to be confused with Discord SessionId)
     */
	public sessionId: string | null;

	/**
     * @param manager Shoukaku instance
     * @param options Options on creating this node
     * @param options.name Name of this node
     * @param options.url URL of Lavalink
     * @param options.auth Credentials to access Lavalnk
     * @param options.secure Whether to use secure protocols or not
     * @param options.group Group of this node
     */
	constructor(manager: Shoukaku, options: NodeOption) {
		super();
		this.manager = manager;
		this.rest = new (this.manager.options.structures.rest ?? Rest)(this, options);
		this.name = options.name;
		this.group = options.group;
		this.auth = options.auth;
		this.url = `${options.secure ? 'wss' : 'ws'}://${options.url}/v${Versions.WEBSOCKET_VERSION}/websocket`;
		this.state = State.IDLE;
		this.reconnects = 0;
		this.stats = null;
		this.info = null;
		this.ws = null;
		this.sessionId = null;
	}

	/**
     * Penalties for load balancing
     * @returns Penalty score
     * @internal @readonly
     */
	get penalties(): number {
		let penalties = 0;
		if (!this.stats) return penalties;

		penalties += this.stats.players;
		penalties += Math.round(Math.pow(1.05, 100 * this.stats.cpu.systemLoad) * 10 - 10);

		if (this.stats.frameStats) {
			penalties += this.stats.frameStats.deficit;
			penalties += this.stats.frameStats.nulled * 2;
		}

		return penalties;
	}

	/**
     * Connect to Lavalink
     */
	public connect(): void {
		if (!this.manager.id) throw new Error('UserId missing, probably your connector is misconfigured?');

		if (this.state !== State.IDLE) return;

		this.state = State.CONNECTING;

		const headers: NonResumableHeaders | ResumableHeaders = {
			'Client-Name': ShoukakuClientInfo,
			'User-Agent': this.manager.options.userAgent,
			'Authorization': this.auth,
			'User-Id': this.manager.id
		};

		if (this.sessionId) {
			headers['Session-Id'] = this.sessionId;
			this.emit('debug', `[Socket] -> [${this.name}] : Session-Id is present, attempting to resume`);
		}

		const url = new URL(this.url);
		this.ws = new Websocket(url.toString(), { headers } as Websocket.ClientOptions);

		this.emit('debug', `[Socket] -> [${this.name}] : Connecting to ${this.url} ...`);

		this.ws.once('upgrade', response => this.open(response));
		this.ws.once('close', (...args) => this.close(...args));
		this.ws.on('error', error => this.error(error));
		this.ws.on('message', data => void this.message(data).catch(error => this.error(error as Error)));
	}

	/**
     * Disconnect from Lavalink
     * @param code Status code
     * @param reason Reason for disconnect
     */
	public disconnect(code: number, reason?: string): void {
		if (this.state !== State.CONNECTED && this.state !== State.CONNECTING) return;

		this.state = State.DISCONNECTING;

		if (this.ws)
			this.ws.close(code, reason);
		else
			void this.close(1000, Buffer.from(reason || 'Unknown Reason', 'utf-8'));
	}

	/**
     * Handle connection open event from Lavalink
     * @param response Response from Lavalink
     * @internal
     */
	private open(response: IncomingMessage): void {
		this.reconnects = 0;

		const resumed = response.headers['session-resumed'] === 'true';

		if (!resumed) {
			this.sessionId = null;
		}

		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		this.emit('debug', `[Socket] <-> [${this.name}] : Connection Handshake Done => ${this.url} | Resumed Header Value: ${resumed} | Lavalink Api Version: ${response.headers['lavalink-api-version']}`);
	}

	/**
     * Handle message from Lavalink
     * @param message JSON message
     * @internal
     */
	private async message(message: unknown): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const json: Ready | Stats | PlayerUpdate | TrackStartEvent | TrackEndEvent | TrackStuckEvent | TrackExceptionEvent | WebSocketClosedEvent = JSON.parse(message as string);
		if (!json) return;
		this.emit('raw', json);
		switch (json.op) {
			case OpCodes.STATS:
				this.emit('debug', `[Socket] <- [${this.name}] : Node Status Update | Server Load: ${this.penalties}`);
				this.stats = json;
				break;
			case OpCodes.READY: {
				this.state = State.CONNECTED;

				if (!json.sessionId) {
					this.emit('debug', `[Socket] -> [${this.name}] : No session id found from ready op? disconnecting and reconnecting to avoid issues`);
					return this.disconnect(1000);
				}

				this.sessionId = json.sessionId;

				const players = [ ...this.manager.players.values() ].filter(player => player.node.name === this.name);

				let resumedByLibrary = false;
				if (!json.resumed && Boolean(players.length && this.manager.options.resumeByLibrary)) {
					try {
						await this.resumePlayers();
						resumedByLibrary = true;
					} catch (error) {
						this.error(error as Error);
					}
				}

				this.emit('debug', `[Socket] -> [${this.name}] : Lavalink is ready! | Lavalink resume: ${json.resumed} | Lib resume: ${resumedByLibrary}`);
				this.emit('ready', json.resumed, resumedByLibrary);

				if (this.manager.options.resume) {
					await this.rest.updateSession(this.manager.options.resume, this.manager.options.resumeTimeout);
					this.emit('debug', `[Socket] -> [${this.name}] : Resuming configured!`);
				}

				break;
			}
			case OpCodes.EVENT:
			case OpCodes.PLAYER_UPDATE: {
				const player = this.manager.players.get(json.guildId);
				if (!player) return;
				if (json.op === OpCodes.EVENT)
					player.onPlayerEvent(json);
				else
					player.onPlayerUpdate(json);
				break;
			}
			default:
				this.emit('debug', `[Player] -> [Node] : Unknown Message Op, Data => ${JSON.stringify(json)}`);
		}
	}

	/**
     * Handle closed event from lavalink
     * @param code Status close
     * @param reason Reason for connection close
     */
	private async close(code: number, reason: Buffer): Promise<void> {
		this.emit('close', code, String(reason));
		this.emit('debug', `[Socket] <-/-> [${this.name}] : Connection Closed, Code: ${code || 'Unknown Code'}`);

		this.state = State.DISCONNECTING;

		if (this.reconnects >= this.manager.options.reconnectTries) {
			this.sessionId = null;

			let count = 0;

			if (this.manager.options.moveOnDisconnect) {
				count = await this.movePlayers();
			}

			this.ws?.removeAllListeners();
			this.ws?.close();
			this.ws = null;

			if (!this.manager.options.resume) {
				this.sessionId = null;
			}

			this.state = State.IDLE;

			this.emit('disconnect', count);

			return;
		}

		this.state = State.IDLE;

		this.emit('reconnecting', this.manager.options.reconnectTries - this.reconnects, this.manager.options.reconnectInterval);
		this.emit('debug', `[Socket] -> [${this.name}] : Reconnecting in ${this.manager.options.reconnectInterval} seconds. ${this.manager.options.reconnectTries - this.reconnects} tries left`);

		await wait(this.manager.options.reconnectInterval * 1000);

		this.reconnects++;

		this.connect();
	}

	/**
     * To emit error events easily
     * @param error error message
     */
	public error(error: Error): void {
		this.emit('error', error);
	}

	/**
     * Tries to resume the players internally
     * @internal
     */
	private async resumePlayers(): Promise<void> {
		const playersWithData = [];
		const playersWithoutData = [];

		for (const player of this.manager.players.values()) {
			const serverUpdate = this.manager.connections.get(player.guildId)?.serverUpdate;
			if (serverUpdate)
				playersWithData.push(player);
			else
				playersWithoutData.push(player);
		}

		await Promise.allSettled([
			...playersWithData.map(player => player.resume()),
			...playersWithoutData.map(player => this.manager.leaveVoiceChannel(player.guildId))
		]);
	}

	/**
     * Tries to move the players to another node
     * @internal
     */
	private async movePlayers(): Promise<number> {
		const players = [ ...this.manager.players.values() ];
		const data = await Promise.allSettled(players.map(player => player.move()));
		return data.filter(results => results.status === 'fulfilled').length;
	}
}
