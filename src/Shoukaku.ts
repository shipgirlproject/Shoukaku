import { Connector } from './connectors/Connector';
import { ShoukakuDefaults, VoiceState } from './Constants';
import { Connection } from './guild/Connection';
import { Player } from './guild/Player';
import { Node } from './node/Node';
import { Rest } from './node/Rest';
import { Constructor, mergeDefault, TypedEventEmitter } from './Utils';

export interface Structures {
	/**
     * A custom structure that extends the Rest class
     */
	rest?: Constructor<Rest>;
	/**
     * A custom structure that extends the Player class
     */
	player?: Constructor<Player>;
}

export interface NodeOption {
	/**
     * Name of the Lavalink node
     */
	name: string;
	/**
     * Lavalink node host and port without any prefix
     */
	url: string;
	/**
     * Credentials to access Lavalink
     */
	auth: string;
	/**
     * Whether to use secure protocols or not
     */
	secure?: boolean;
	/**
     * Name of the Lavalink node group
     */
	group?: string;
	/**
     * The region of this Lavalink node (e.g., 'us-east', 'europe', 'japan')
     */
	region?: string;
}

export interface ShoukakuOptions {
	/**
     * Whether to resume a connection on disconnect to Lavalink (Server Side) (Note: DOES NOT RESUME WHEN THE LAVALINK SERVER DIES)
     */
	resume?: boolean;
	/**
     * Time to wait before lavalink starts to destroy the players of the disconnected client
     */
	resumeTimeout?: number;
	/**
     * Whether to resume the players by doing it in the library side (Client Side) (Note: TRIES TO RESUME REGARDLESS OF WHAT HAPPENED ON A LAVALINK SERVER)
     */
	resumeByLibrary?: boolean;
	/**
     * Number of times to try and reconnect to Lavalink before giving up
     */
	reconnectTries?: number;
	/**
     * Timeout before trying to reconnect
     */
	reconnectInterval?: number;
	/**
     * Time to wait for a response from the Lavalink REST API before giving up
     */
	restTimeout?: number;
	/**
     * Whether to move players to a different Lavalink node when a node disconnects
     */
	moveOnDisconnect?: boolean;
	/**
     * User Agent to use when making requests to Lavalink
     */
	userAgent?: string;
	/**
     * Custom structures for shoukaku to use
     */
	structures?: Structures;
	/**
     * Timeout before abort connection
     */
	voiceConnectionTimeout?: number;
	/**
     * Node Resolver to use if you want to customize it
     */
	nodeResolver?: (nodes: Map<string, Node>, connection?: Connection) => Node | undefined;
}

export interface VoiceChannelOptions {
	guildId: string;
	shardId: number;
	channelId: string;
	deaf?: boolean;
	mute?: boolean;
}

export type ShoukakuEvents = {
	'reconnecting': [name: string, reconnectsLeft: number, reconnectInterval: number];
	'debug': [name: string, info: string];
	'error': [name: string, error: Error];
	'ready': [name: string, lavalinkResume: boolean, libraryResume: boolean];
	'close': [name: string, code: number, reason: string];
	'disconnect': [name: string, count: number];
	'raw': [name: string, json: unknown];
};

/**
 * Main Shoukaku class
 */
export class Shoukaku extends TypedEventEmitter<ShoukakuEvents> {
	public readonly connector: Connector;
	public readonly options: Required<ShoukakuOptions>;
	public readonly nodes: Map<string, Node>;
	public readonly connections: Map<string, Connection>;
	public readonly players: Map<string, Player>;
	public id: string | null;

	constructor(connector: Connector, nodes: NodeOption[], options: ShoukakuOptions = {}) {
		super();
		this.connector = connector.set(this);
		this.options = mergeDefault<ShoukakuOptions>(ShoukakuDefaults, options);
		this.nodes = new Map();
		this.connections = new Map();
		this.players = new Map();
		this.id = null;
		this.connector.listen(nodes);
	}

	public getIdealNode(connection?: Connection): Node | undefined {
		return this.options.nodeResolver(this.nodes, connection);
	}

	public addNode(options: NodeOption): void {
		const node = new Node(this, options);
		node.on('debug', (...args) => this.emit('debug', node.name, ...args));
		node.on('reconnecting', (...args) => this.emit('reconnecting', node.name, ...args));
		node.on('error', (...args) => this.emit('error', node.name, ...args));
		node.on('close', (...args) => this.emit('close', node.name, ...args));
		node.on('ready', (...args) => this.emit('ready', node.name, ...args));
		node.on('raw', (...args) => this.emit('raw', node.name, ...args));
		node.once('disconnect', () => this.nodes.delete(node.name));
		node.connect().catch((error) => this.emit('error', node.name, error as Error));
		this.nodes.set(node.name, node);
	}

	public removeNode(name: string, reason = 'Remove node executed'): void {
		const node = this.nodes.get(name);
		if (!node) throw new Error('The node name you specified doesn\'t exist');
		node.disconnect(1000, reason);
		this.nodes.delete(name);
	}

	public async joinVoiceChannel(options: VoiceChannelOptions): Promise<Player> {
		if (this.connections.has(options.guildId))
			throw new Error('This guild already have an existing connection');
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
			if (!node)
				throw new Error('Can\'t find any nodes to connect on');
			const player = this.options.structures.player ? new this.options.structures.player(connection.guildId, node) : new Player(connection.guildId, node);
			const onUpdate = (state: VoiceState) => {
				if (state !== VoiceState.SESSION_READY) return;
				void player.sendServerUpdate(connection);
			};
			await player.sendServerUpdate(connection);
			connection.on('connectionUpdate', onUpdate);
			this.players.set(player.guildId, player);
			return player;
		} catch (error) {
			connection.disconnect();
			this.connections.delete(options.guildId);
			throw error;
		}
	}

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
			} catch { /* empty */ }
			player.clean();
			this.players.delete(guildId);
		}
	}
}
