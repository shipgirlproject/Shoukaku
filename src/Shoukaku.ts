import { ShoukakuDefaults, VoiceState } from "./Constants.js";
import type { Constructor } from "./Utils.js";
import { mergeDefault, TypedEventEmitter } from "./Utils.js";
import type { Connector } from "./connectors/Connector.js";
import { Connection } from "./guild/Connection.js";
import { Player } from "./guild/Player.js";
import { Node } from "./node/Node.js";
import type { Rest } from "./node/Rest.js";

export interface Structures {
	/**
	 * A custom structure that extends the Player class
	 */
	player?: Constructor<Player>;
	/**
	 * A custom structure that extends the Rest class
	 */
	rest?: Constructor<Rest>;
}

export interface NodeOption {
	/**
	 * Credentials to access Lavalink
	 */
	auth: string;
	/**
	 * Name of the Lavalink node group
	 */
	group?: string;
	/**
	 * Name of the Lavalink node
	 */
	name: string;
	/**
	 * Whether to use secure protocols or not
	 */
	secure?: boolean;
	/**
	 * Lavalink node host and port without any prefix
	 */
	url: string;
}

export interface ShoukakuOptions {
	/**
	 * Whether to move players to a different Lavalink node when a node disconnects
	 */
	moveOnDisconnect?: boolean;
	/**
	 * Node Resolver to use if you want to customize it
	 */
	nodeResolver?(nodes: Map<string, Node>, connection?: Connection): Node | undefined;
	/**
	 * Timeout before trying to reconnect
	 */
	reconnectInterval?: number;
	/**
	 * Number of times to try and reconnect to Lavalink before giving up
	 */
	reconnectTries?: number;
	/**
	 * Time to wait for a response from the Lavalink REST API before giving up
	 */
	restTimeout?: number;
	/**
	 * Whether to resume a connection on disconnect to Lavalink (Server Side) (Note: DOES NOT RESUME WHEN THE LAVALINK SERVER DIES)
	 */
	resume?: boolean;
	/**
	 * Whether to resume the players by doing it in the library side (Client Side) (Note: TRIES TO RESUME REGARDLESS OF WHAT HAPPENED ON A LAVALINK SERVER)
	 */
	resumeByLibrary?: boolean;
	/**
	 * Time to wait before lavalink starts to destroy the players of the disconnected client
	 */
	resumeTimeout?: number;
	/**
	 * Custom structures for shoukaku to use
	 */
	structures?: Structures;
	/**
	 * User Agent to use when making requests to Lavalink
	 */
	userAgent?: string;
	/**
	 * Timeout before abort connection
	 */
	voiceConnectionTimeout?: number;
}

export interface VoiceChannelOptions {
	channelId: string;
	deaf?: boolean;
	guildId: string;
	mute?: boolean;
	shardId: number;
}

// Interfaces are not final, but types are, and therefore has an index signature
// https://stackoverflow.com/a/64970740
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ShoukakuEvents = {
	/**
	 * Emitted when a websocket connection to Lavalink closes
	 *
	 * @eventProperty
	 */
	close: [name: string, code: number, reason: string];
	/**
	 * Emitted when data useful for debugging is produced
	 *
	 * @eventProperty
	 */
	debug: [name: string, info: string];
	/**
	 * Emitted when a websocket connection to Lavalink disconnects
	 *
	 * @eventProperty
	 */
	disconnect: [name: string, count: number];
	/**
	 * Emitted when an error occurs
	 *
	 * @eventProperty
	 */
	error: [name: string, error: Error];
	/**
	 * Emitted when a raw message is received from Lavalink
	 *
	 * @eventProperty
	 */
	raw: [name: string, json: unknown];
	/**
	 * Emitted when Shoukaku is ready to receive operations
	 *
	 * @eventProperty
	 */
	ready: [name: string, lavalinkResume: boolean, libraryResume: boolean];
	/**
	 * Emitted when reconnect tries are occurring and how many tries are left
	 *
	 * @eventProperty
	 */
	reconnecting: [name: string, reconnectsLeft: number, reconnectInterval: number];
};

/**
 * Main Shoukaku class
 */
export class Shoukaku extends TypedEventEmitter<ShoukakuEvents> {
	/**
	 * Discord library connector
	 */
	public readonly connector: Connector;

	/**
	 * Shoukaku options
	 */
	public readonly options: Required<ShoukakuOptions>;

	/**
	 * Connected Lavalink nodes
	 */
	public readonly nodes: Map<string, Node>;

	/**
	 * Voice connections being handled
	 */
	public readonly connections: Map<string, Connection>;

	/**
	 * Players being handled
	 */
	public readonly players: Map<string, Player>;

	/**
	 * Shoukaku instance identifier
	 */
	public id: string | null;

	/**
	 * @param connector - A Discord library connector
	 * @param nodes - An array that conforms to the NodeOption type that specifies nodes to connect to
	 * @param options - Options to pass to create this Shoukaku instance
	 *   - resume: Whether to resume a connection on disconnect to Lavalink (Server Side) (Note: DOES NOT RESUME WHEN THE LAVALINK SERVER DIES)
	 *   - resumeTimeout: Time to wait before lavalink starts to destroy the players of the disconnected client
	 *   - resumeByLibrary: Whether to resume the players by doing it in the library side (Client Side) (Note: TRIES TO RESUME REGARDLESS OF WHAT HAPPENED ON A LAVALINK SERVER)
	 *   - reconnectTries: Number of times to try and reconnect to Lavalink before giving up
	 *   - reconnectInterval: Timeout before trying to reconnect
	 *   - restTimeout: Time to wait for a response from the Lavalink REST API before giving up
	 *   - moveOnDisconnect: Whether to move players to a different Lavalink node when a node disconnects
	 *   - userAgent: User Agent to use when making requests to Lavalink
	 *   - structures: Custom structures for shoukaku to use
	 *   - nodeResolver: Used if you have custom lavalink node resolving
	 */
	public constructor(connector: Connector, nodes: NodeOption[], options: ShoukakuOptions = {}) {
		super();
		this.connector = connector.set(this);
		this.options = mergeDefault<ShoukakuOptions>(ShoukakuDefaults, options);
		this.nodes = new Map();
		this.connections = new Map();
		this.players = new Map();
		this.id = null;
		this.connector.listen(nodes);
	}

	/**
	 * Gets an ideal node based on the nodeResolver you provided
	 *
	 * @param connection - Optional connection class for ideal node selection, if you use it
	 * @returns An ideal node for you to do things with
	 */
	public getIdealNode(connection?: Connection): Node | undefined {
		return this.options.nodeResolver(this.nodes, connection);
	}

	/**
	 * Add a Lavalink node to the pool of available nodes
	 *
	 * @param options - Node options
	 *   - name: Name of this node
	 *   - url: URL of Lavalink
	 *   - auth: Credentials to access Lavalink
	 *   - secure: Whether to use secure protocols or not
	 *   - group: Group of this node
	 */
	public addNode(options: NodeOption): void {
		const node = new Node(this, options);
		node.on("debug", (...args) => this.emit("debug", node.name, ...args));
		node.on("reconnecting", (...args) => this.emit("reconnecting", node.name, ...args));
		node.on("error", (...args) => this.emit("error", node.name, ...args));
		node.on("close", (...args) => this.emit("close", node.name, ...args));
		node.on("ready", (...args) => this.emit("ready", node.name, ...args));
		node.on("raw", (...args) => this.emit("raw", node.name, ...args));
		node.once("disconnect", () => this.nodes.delete(node.name));

		void (async () => {
			try {
				await node.connect();
			} catch (error) {
				this.emit("error", node.name, error as Error);
			}
		})();

		this.nodes.set(node.name, node);
	}

	/**
	 * Remove a Lavalink node from the pool of available nodes
	 *
	 * @param name - Name of the node
	 * @param reason - Reason of removing the node
	 */
	public removeNode(name: string, reason = "Remove node executed"): void {
		const node = this.nodes.get(name);
		if (!node) {
			throw new Error("The node name you specified doesn't exist");
		}

		node.disconnect(1_000, reason);
		this.nodes.delete(name);
	}

	/**
	 * Joins a voice channel
	 *
	 * @param options - Voice channel options
	 *   - guildId: GuildId in which the ChannelId of the voice channel is located
	 *   - shardId: ShardId to track where this should send on sharded websockets, put 0 if you are unsharded
	 *   - channelId: ChannelId of the voice channel you want to connect to
	 *   - deaf: Optional boolean value to specify whether to deafen or undeafen the current bot user
	 *   - mute: Optional boolean value to specify whether to mute or unmute the current bot user
	 * @returns The created player
	 */
	public async joinVoiceChannel(options: VoiceChannelOptions): Promise<Player> {
		if (this.connections.has(options.guildId)) {
			throw new Error("This guild already have an existing connection");
		}

		const connection = new Connection(this, options);
		this.connections.set(connection.guildId, connection);
		try {
			await connection.connect();
		} catch (error) {
			this.connections.delete(options.guildId);
			throw error;
		}

		try {
			const node = this.getIdealNode(connection);
			if (!node) {
				throw new Error("Can't find any nodes to connect on");
			}

			const player = this.options.structures.player
				? new this.options.structures.player(connection.guildId, node)
				: new Player(connection.guildId, node);
			const onUpdate = (state: VoiceState) => {
				if (state !== VoiceState.SESSION_READY) {
					return;
				}

				void player.sendServerUpdate(connection);
			};

			await player.sendServerUpdate(connection);
			connection.on("connectionUpdate", onUpdate);
			this.players.set(player.guildId, player);
			return player;
		} catch (error) {
			connection.disconnect();
			this.connections.delete(options.guildId);
			throw error;
		}
	}

	/**
	 * Leaves a voice channel
	 *
	 * @param guildId - The id of the guild you want to delete
	 * @returns The destroyed / disconnected player or undefined if none
	 */
	public async leaveVoiceChannel(guildId: string): Promise<void> {
		const connection = this.connections.get(guildId);
		if (connection) {
			connection.disconnect();
			this.connections.delete(guildId);
		}

		const player = this.players.get(guildId);
		if (player) {
			try {
				await player.destroy();
			} catch {
				/* empty */
			}

			player.clean();
			this.players.delete(guildId);
		}
	}
}
