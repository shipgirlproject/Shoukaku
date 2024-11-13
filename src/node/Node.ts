import { IncomingMessage } from 'node:http';
import Websocket from 'ws';
import * as z from 'zod';
// eslint-disable-next-line import-x/no-cycle
import { OpCodes, ShoukakuClientInfo, State, Versions } from '../Constants';
// eslint-disable-next-line import-x/no-cycle
import { PlayerUpdate, TrackEndEvent, TrackExceptionEvent, TrackStartEvent, TrackStuckEvent, WebSocketClosedEvent } from '../guild/Player';
import { NodeOption, Shoukaku, ShoukakuEvents } from '../Shoukaku';
import { TypedEventEmitter, wait } from '../Utils';
// eslint-disable-next-line import-x/no-cycle
import { Rest } from './Rest';

/**
 * Dispatched by Lavalink upon successful connection and authorization
 * @see https://lavalink.dev/api/websocket.html#ready-op
 */
export const Ready = z.object({
	/**
	 * WebSocket OpCode
	 * @see {@link OpCodes} representation in Shoukaku
	 * @see https://lavalink.dev/api/websocket.html#op-types
	 */
	op: z.literal(OpCodes.enum.READY),
	/**
	 * Whether this session was resumed
	 */
	resumed: z.boolean(),
	/**
	 * The Lavalink session id of this connection (not Discord voice session id)
	 */
	sessionId: z.string()
});

export type Ready = z.TypeOf<typeof Ready>;

/**
 * Memory statistics
 * @see https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Runtime.html
 * @see https://lavalink.dev/api/websocket#memory
 */
export const NodeMemory = z.object({
	/**
	 * Reservable memory in bytes
	 * @see https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Runtime.html#maxMemory()
	 */
	reservable: z.number().int().min(0),
	/**
	 * Used memory in bytes
	 * 
	 * totalMemory() - freeMemory()
	 */
	used: z.number().int().min(0),
	/**
	 * Free memory in bytes
	 * @see https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Runtime.html#freeMemory()
	 */
	free: z.number().int().min(0),
	/**
	 * Allocated memory in bytes
	 * @see https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Runtime.html#totalMemory()
	 */
	allocated: z.number().int().min(0)
});

export type NodeMemory = z.TypeOf<typeof NodeMemory>;

/**
 * Frame statistics
 * @see https://lavalink.dev/api/websocket#frame-stats
 */
export const NodeFrameStats = z.object({
	/**
	 * Number of frames sent to Discord
	 */
	sent: z.number().int(),
	/**
	 * Difference between number of sent frames and expected number of frames
	 * 
	 * Expected amount of frames is 3000 (1 frame every 20 milliseconds)
	 * 
	 * If negative, too many frames were sent, if positive, not enough frames were sent
	 */
	deficit: z.number().int(),
	/**
	 * Number of frames nulled
	 */
	nulled: z.number().int()
});

export type NodeFrameStats = z.TypeOf<typeof NodeFrameStats>;

/**
 * CPU statistics
 * @see https://lavalink.dev/api/websocket#cpu
 */
export const NodeCpu = z.object({
	/**
	 * Number of CPU cores available to JVM
	 * @see https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Runtime.html#availableProcessors()
	 */
	cores: z.number(),
	/**
	 * Recent system CPU usage from load ticks
	 * @see https://www.oshi.ooo/oshi-core/apidocs/oshi/hardware/CentralProcessor.html#getSystemCpuLoadBetweenTicks(long%5B%5D)
	 */
	systemLoad: z.number(),
	/**
	 * Recent Lavalink CPU usage from CPU time per core
	 */
	lavalinkLoad: z.number()
});

export type NodeCpu = z.TypeOf<typeof NodeCpu>;

/**
 * Dispatched by Lavalink every minute when the node sends statistics
 * @see https://lavalink.dev/api/websocket.html#stats-op
 */
export const Stats = z.object({
	/**
	 * WebSocket OpCode
	 * @see {@link OpCodes} representation in Shoukaku
	 * @see https://lavalink.dev/api/websocket.html#op-types
	 */
	op: z.literal(OpCodes.enum.STATS),
	/**
	 * Number of players connected to node
	 */
	players: z.number().int().min(0),
	/**
	 * Number of players playing a track
	 */
	playingPlayers: z.number().int().min(0),
	/**
	 * Node uptime in milliseconds
	 */
	uptime: z.number().int().min(0),
	/**
	 * Memory statistics
	 * @see {@link NodeMemory} representation in Shoukaku
	 * @see https://lavalink.dev/api/websocket#memory
	 */
	memory: NodeMemory,
	/**
	 * CPU statistics
	 * @see {@link NodeCpu} representation in Shoukaku
	 * @see https://lavalink.dev/api/websocket#cpu
	 */
	cpu: NodeCpu,
	/**
	 * Frame statistics, null when node has no players or retrieved via /v4/stats endpoint
	 * @see {@link NodeFrameStats} representation in Shoukaku
	 * @see https://lavalink.dev/api/websocket#frame-stats
	 */
	frameStats: z.optional(NodeFrameStats)
});

export type Stats = z.TypeOf<typeof Stats>;

/**
 * Parsed Semantic Versioning 2.0.0
 * @see https://semver.org/spec/v2.0.0.html
 * @see https://lavalink.dev/api/rest#version-object
 */
export const NodeInfoVersion = z.object({
	/**
	 * Full version string
	 */
	semver: z.string(),
	/**
	 * Major version
	 */
	major: z.number().int(),
	/**
	 * Minor version
	 */
	minor: z.number().int(),
	/**
	 * Patch version
	 */
	patch: z.number().int(),
	/**
	 * Prerelease version
	 */
	preRelease: z.optional(z.string()),
	/**
	 * Build metadata
	 */
	build: z.optional(z.string())
});

export type NodeInfoVersion = z.TypeOf<typeof NodeInfoVersion>;

/**
 * Lavalink Git information
 * @see https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History
 * @see https://lavalink.dev/api/rest#git-object
 */
export const NodeInfoGit = z.object({
	/**
	 * Git branch
	 */
	branch: z.string(),
	/**
	 * Git commit hash
	 */
	commit: z.string(),
	/**
	 * UNIX timestamp in miliseconds when Git commit was created
	 */
	commitTime: z.number().int().min(0)
});

export type NodeInfoGit = z.TypeOf<typeof NodeInfoGit>;

/**
 * List of available plugins
 * @see https://lavalink.dev/plugins
 * @see https://lavalink.dev/api/rest#plugin-object
 */
export const NodeInfoPlugin = z.object({
	/**
	 * Plugin name
	 */
	name: z.string(),
	/**
	 * Plugin version
	 */
	version: z.string()
});

export type NodeInfoPlugin = z.TypeOf<typeof NodeInfoPlugin>;

/**
 * Node information
 * @see https://lavalink.dev/api/rest.html#info-response
 */
export const NodeInfo = z.object({
	/**
	 * Lavalink server version
	 * @see {@link NodeInfoVersion} representation in Shoukaku
	 * @see https://semver.org/spec/v2.0.0.html
	 * @see https://lavalink.dev/api/rest.html#version-object
	 */
	version: NodeInfoVersion,
	/**
	 * UNIX timestamp in miliseconds when Lavalink JAR was built
	 */
	buildTime: z.number().int().min(0),
	/**
	 * Lavalink Git information
	 * @see {@link NodeInfoGit} representation in Shoukaku
	 * @see https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History
	 * @see https://lavalink.dev/api/rest#git-object
	 */
	git: NodeInfoGit,
	/**
	 * JVM version string
	 * @see https://en.wikipedia.org/wiki/Java_version_history#Release_table
	 */
	jvm: z.string(),
	/**
	 * Lavaplayer version string
	 * @see https://github.com/lavalink-devs/lavaplayer/releases
	 */
	lavaplayer: z.string(),
	/**
	 * List of enabled source managers
	 * @see https://lavalink.dev/configuration/index.html
	 */
	sourceManagers: z.array(z.string()),
	/**
	 * List of enabled filters
	 * @see https://lavalink.dev/configuration/index.html
	 */
	filters: z.array(z.string()),
	/**
	 * List of available plugins
	 * @see {@link NodeInfoPlugin} representation in Shoukaku
	 * @see https://lavalink.dev/plugins
	 * @see https://lavalink.dev/api/rest#plugin-object
	 */
	plugins: z.array(NodeInfoPlugin)
});

export type NodeInfo = z.TypeOf<typeof NodeInfo>;

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
	 * The number of reconnects to Lavalink
	 */

	public reconnects: number;
	/**
	 * The state of this connection
	 */
	public state: State;

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
	 * Boolean that represents if the node has initialized once
	 */
	protected initialized: boolean;

	/**
	 * Boolean that represents if this connection is destroyed
	 */
	protected destroyed: boolean;

	/**
	 * Whether to validate Lavalink responses
	 */
	private readonly validate: boolean;

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
		this.reconnects = 0;
		this.state = State.DISCONNECTED;
		this.stats = null;
		this.info = null;
		this.ws = null;
		this.sessionId = options.sessionId ?? null;
		this.initialized = false;
		this.destroyed = false;
		this.validate = this.manager.options.validate;
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
	 * If we should clean this node
	 * @internal @readonly
	 */
	private get shouldClean(): boolean {
		return this.destroyed || this.reconnects >= this.manager.options.reconnectTries;
	}

	/**
	 * Connect to Lavalink
	 */
	public connect(): void {
		if (!this.manager.id) throw new Error('Don\'t connect a node when the library is not yet ready');
		if (this.destroyed) throw new Error('You can\'t re-use the same instance of a node once disconnected, please re-add the node again');

		this.state = State.CONNECTING;

		const headers: NonResumableHeaders | ResumableHeaders = {
			'Client-Name': ShoukakuClientInfo,
			'User-Agent': this.manager.options.userAgent,
			'Authorization': this.auth,
			'User-Id': this.manager.id
		};

		if (this.sessionId)
			headers['Session-Id'] = this.sessionId;
		if (!this.initialized)
			this.initialized = true;

		this.emit('debug', `[Socket] -> [${this.name}] : Connecting to ${this.url} ...`);

		const url = new URL(this.url);
		this.ws = new Websocket(url.toString(), { headers });

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
		this.destroyed = true;
		this.internalDisconnect(code, reason);
	}

	/**
	 * Handle connection open event from Lavalink
	 * @param response Response from Lavalink
	 * @internal
	 */
	private open(response: IncomingMessage): void {
		const resumed = response.headers['session-resumed'];
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		this.emit('debug', `[Socket] <-> [${this.name}] : Connection Handshake Done! ${this.url} | Resumed Header Value: ${resumed}`);
		this.reconnects = 0;
		this.state = State.NEARLY;
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
			case OpCodes.enum.STATS:
				this.emit('debug', `[Socket] <- [${this.name}] : Node Status Update | Server Load: ${this.penalties}`);
				this.stats = this.validate ? Stats.parse(json) : json;
				break;
			case OpCodes.enum.READY: {
				const data = this.validate ? Ready.parse(json) : json;

				if (!data.sessionId) {
					this.emit('debug', `[Socket] -> [${this.name}] : No session id found from ready op? disconnecting and reconnecting to avoid issues`);
					return this.internalDisconnect(1000);
				}

				this.sessionId = data.sessionId;

				const players = [ ...this.manager.players.values() ].filter(player => player.node.name === this.name);

				let resumedByLibrary = false;
				if (!data.resumed && Boolean(this.initialized && (players.length && this.manager.options.resumeByLibrary))) {
					try {
						await this.resumePlayers();
						resumedByLibrary = true;
					} catch (error) {
						this.error(error as Error);
					}
				}

				this.state = State.CONNECTED;
				this.emit('debug', `[Socket] -> [${this.name}] : Lavalink is ready! | Lavalink resume: ${data.resumed} | Lib resume: ${resumedByLibrary}`);
				this.emit('ready', data.resumed, resumedByLibrary);

				if (this.manager.options.resume) {
					await this.rest.updateSession(this.manager.options.resume, this.manager.options.resumeTimeout);
					this.emit('debug', `[Socket] -> [${this.name}] : Resuming configured!`);
				}

				break;
			}
			case OpCodes.enum.EVENT:
			case OpCodes.enum.PLAYER_UPDATE: {
				const player = 'guildId' in json && this.manager.players.get(json.guildId);
				if (!player) return;
				if (json.op === OpCodes.enum.EVENT)
					player.onPlayerEvent(json);
				else
					player.onPlayerUpdate(this.validate ? PlayerUpdate.parse(json) : json);
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
	private close(code: number, reason: Buffer): void {
		this.emit('debug', `[Socket] <-/-> [${this.name}] : Connection Closed, Code: ${code || 'Unknown Code'}`);
		this.emit('close', code, String(reason));
		if (this.shouldClean)
			void this.clean();
		else
			void this.reconnect();
	}

	/**
	 * To emit error events easily
	 * @param error error message
	 */
	public error(error: Error): void {
		this.emit('error', error);
	}

	/**
	 * Internal disconnect function
	 * @internal
	 */
	private internalDisconnect(code: number, reason?: string): void {
		if (this.destroyed) return;

		this.state = State.DISCONNECTING;

		if (this.ws)
			this.ws.close(code, reason);
		else
			void this.clean();
	}

	/**
	 * Destroys the websocket connection
	 * @internal
	 */
	private destroy(count = 0): void {
		this.ws?.removeAllListeners();
		this.ws?.close();
		this.ws = null;
		this.state = State.DISCONNECTED;
		if (!this.manager.options.resume) {
			this.sessionId = null;
		}
		if (this.shouldClean) {
			this.destroyed = true;
			this.sessionId = null;
			this.emit('disconnect', count);
		}
	}

	/**
	 * Cleans and moves players to other nodes if possible
	 * @internal
	 */
	private async clean(): Promise<void> {
		const move = this.manager.options.moveOnDisconnect;
		if (!move) return this.destroy();
		let count = 0;
		try {
			count = await this.movePlayers();
		} catch (error) {
			this.error(error as Error);
		} finally {
			this.destroy(count);
		}
	}

	/**
	 * Reconnect to Lavalink
	 * @internal
	 */
	private async reconnect(): Promise<void> {
		if (this.state === State.RECONNECTING) return;
		if (this.state !== State.DISCONNECTED) this.destroy();
		this.state = State.RECONNECTING;
		this.reconnects++;
		this.emit('reconnecting', this.manager.options.reconnectTries - this.reconnects, this.manager.options.reconnectInterval);
		this.emit('debug', `[Socket] -> [${this.name}] : Reconnecting in ${this.manager.options.reconnectInterval} seconds. ${this.manager.options.reconnectTries - this.reconnects} tries left`);
		await wait(this.manager.options.reconnectInterval * 1000);
		this.connect();
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
