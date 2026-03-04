import { IncomingMessage } from 'http';
import Websocket from 'ws';
import { OpCodes, ShoukakuClientInfo, State, Versions } from '../Constants';
import type {
	PlayerUpdate,
	TrackEndEvent,
	TrackExceptionEvent,
	TrackStartEvent,
	TrackStuckEvent,
	WebSocketClosedEvent
} from '../guild/Player';
import type { NodeOption, Shoukaku, ShoukakuEvents } from '../Shoukaku';
import { TypedEventEmitter, wait } from '../Utils';
import { Rest } from './Rest';

/**
 * Dispatched by Lavalink upon successful connection and authorization
 * @see https://lavalink.dev/api/websocket.html#ready-op
 */
export interface Ready {
	op: OpCodes.READY;
	/**
     * Whether this session was resumed
     */
	resumed: boolean;
	/**
     * The Lavalink session ID of this connection (not to be confused with a Discord voice session id)
     */
	sessionId: string;
}

export interface NodeMemory {
	/**
	 * Amount of reservable memory in bytes
	 */
	reservable: number;
	/**
	 * Amount of used memory in bytes
	 */
	used: number;
	/**
	 * Amount of free memory in bytes
	 */
	free: number;
	/**
	 * Amount of reservable memory in bytes
	 */
	allocated: number;
}

export interface NodeFrameStats {
	/**
	 * Amount of frames sent to Discord
	 */
	sent: number;
	/**
	 * Difference between sent frames and the expected amount of frames, the expected 
	 * amount of frames is 3000 (1 every 20 ms) per player, a negative deficit means 
	 * too many frames were sent, a positive deficit means not enough frames were sent
	 */
	deficit: number;
	/**
	 * Amount of frames that were nulled
	 */
	nulled: number;
}

export interface NodeCpu {
	cores: number;
	systemLoad: number;
	lavalinkLoad: number;
}

/**
 * Statistics for Lavalink Node
 * @see https://lavalink.dev/api/websocket.html#stats-object
 */
export interface Stats {
	op: OpCodes.STATS;
	/**
     * Amount of players connected to the node
     */
	players: number;
	/**
     * Amount of players playing a track
     */
	playingPlayers: number;
	/**
     * Memory statistics
     */
	memory: NodeMemory;
	/**
     * Frame statistics, null if the node has no players
     */
	frameStats: NodeFrameStats | null;
	/**
     * CPU statistics
     */
	cpu: NodeCpu;
	/**
     * Uptime of the node in milliseconds
     */
	uptime: number;
}

/**
 * Parsed Semantic Versioning 2.0.0
 * @see https://semver.org/spec/v2.0.0.html
 * @see https://lavalink.dev/api/rest.html#version-object
 */
export interface NodeInfoVersion {
	/**
     * Full version string
     */
	semver: string;
	/**
     * Major version
     */
	major: number;
	/**
     * Minor version
     */
	minor: number;
	/**
     * Patch version
     */
	patch: number;
	/**
     * Pre-release version as a dot separated list of identifiers
     */
	preRelease?: string;
	/**
     * Build metadata as a dot separated list of identifiers
     */
	build?: string;
}

/**
 * Lavalink Git information
 * @see https://lavalink.dev/api/rest.html#git-object
 */
export interface NodeInfoGit {
	/**
     * Branch of build
     */
	branch: string;
	/**
     * Commit hash of build
     */
	commit: string;
	/**
     * Millisecond unix timestamp for when the commit was created
     */
	commitTime: number;
}

/**
 * Lavalink plugins
 * @see https://lavalink.dev/api/rest.html#plugin-object
 */
export interface NodeInfoPlugin {
	/**
     * Name of the plugin
     */
	name: string;
	/**
     * Version of the plugin
     */
	version: string;
}

/**
 * Node information
 * @see https://lavalink.dev/api/rest.html#get-lavalink-info
 */
export interface NodeInfo {
	/**
     * Version of this Lavalink server
     */
	version: NodeInfoVersion;
	/**
     * Millisecond unix timestamp when the Lavalink JAR was built
     */
	buildTime: number;
	/**
     * Git information of this Lavalink server
     */
	git: NodeInfoGit;
	/**
     * JVM version this Lavalink server runs on
     */
	jvm: string;
	/**
     * Lavaplayer version being used by this server
     */
	lavaplayer: string;
	/**
     * Enabled source managers for this server
     */
	sourceManagers: string[];
	/**
     * Enabled filters for this server
     */
	filters: string[];
	/**
     * Enabled plugins for this server
     */
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
     * @param options.auth Credentials to access Lavalink
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
		this.state = State.DISCONNECTED;
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
	public async connect(): Promise<void> {
		if (!this.manager.id)
			throw new Error('UserId missing, probably your connector is misconfigured?');

		if (this.state === State.CONNECTED || this.state === State.CONNECTING)
			return;

		this.cleanupWebsocket();

		this.state = State.CONNECTING;

		const headers: NonResumableHeaders | ResumableHeaders = {
			'Client-Name': ShoukakuClientInfo,
			'User-Agent': this.manager.options.userAgent,
			'Authorization': this.auth,
			'User-Id': this.manager.id
		};

		if (this.sessionId && this.manager.options.resume) {
			headers['Session-Id'] = this.sessionId;
			this.emit('debug', `[Socket] -> [${this.name}] : Session-Id is present, attempting to resume`);
		}

		this.emit('debug', `[Socket] -> [${this.name}] : Connecting to ${this.url} ...`);

		const createConnection = () => {
			const url = new URL(this.url);

			const server = new Websocket(url.toString(), { headers } as Websocket.ClientOptions);

			server.once('upgrade', response => this.open(response));
			server.on('message', data => void this.message(data).catch(error => this.error(error as Error)));
			server.on('error', error => this.error(error));

			return new Promise<Websocket>((resolve, reject) => {
				const onOpen = () => {
					server.removeListener('close', onClose);
					resolve(server);
				};
				const onClose = () => {
					server.removeListener('open', onOpen);
					server.removeAllListeners();
					reject(new Error('Websocket closed before a connection was established'));
				};
				server.once('open', onOpen);
				server.once('close', onClose);
			});
		};

		let connectError: Error | undefined;

		for (this.reconnects = 0; this.reconnects < this.manager.options.reconnectTries; this.reconnects++) {
			try {
				this.ws = await createConnection();
				break;
			} catch (error) {
				this.emit('reconnecting', this.manager.options.reconnectTries - this.reconnects, this.manager.options.reconnectInterval);
				this.emit('debug', `[Socket] -> [${this.name}] : Reconnecting in ${this.manager.options.reconnectInterval} seconds. ${this.manager.options.reconnectTries - this.reconnects} tries left`);
				connectError = error as Error;
				await wait(this.manager.options.reconnectInterval * 1000);
			}
		}

		if (connectError) {
			this.state = State.DISCONNECTED;
			this.cleanupWebsocket();
			let count = 0;
			if (this.manager.options.moveOnDisconnect) {
				count = await this.movePlayers();
			}
			this.emit('disconnect', count);
			// Should I throw or not? :confusion:
			throw connectError;
		}

		this.ws!.once('close', (...args) => void this.close(...args));
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
			void this.close(1000, Buffer.from(reason ?? 'Unknown Reason', 'utf-8'));
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

				this.emit('debug', `[Socket] -> [${this.name}] : Lavalink is ready to communicate !`);
				this.emit('ready', json.resumed, resumedByLibrary);

				if (this.manager.options.resume) {
					await this.rest.updateSession(this.manager.options.resume, this.manager.options.resumeTimeout);
					this.emit('debug', `[Socket] -> [${this.name}] : Resuming configured for this Session Id: ${this.sessionId}`);
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

		try {
			await this.connect();
		} catch (error) {
			this.emit('error', error as Error);
		}
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

	private cleanupWebsocket(): void {
		this.ws?.removeAllListeners();
		this.ws?.close();
		this.ws = null;
	}
}
