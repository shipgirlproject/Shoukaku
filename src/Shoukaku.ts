import { Connector, ConnectorOptions } from './connectors/Connector';
import { ShoukakuDefaults } from './Constants';
import { Connection } from './guild/Connection';
import { Player } from './guild/Player';
import type { Events } from './model/Library';
import {
	PlayerUpdate,
	TrackEndEvent,
	TrackExceptionEvent,
	TrackStartEvent,
	TrackStuckEvent,
	WebSocketClosedEvent
} from './model/Player';
import { Node } from './node/Node';
import type { Rest } from './node/Rest';
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
}

export interface RequiredOptions {
	/**
	 * The user id of the bot where this client will connect on
	 */
	userId: string;
	/**
	 * List of lavalink nodes to use
	 */
	nodes: NodeOption[];
	/**
	 * Library connector for Discord Websocket
	 */
	connectorOptions: ConnectorOptions;
}

export interface OptionalOptions {
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
	nodeResolver?: (nodes: Node[], connection?: Connection) => Node | undefined;
}

export interface VoiceChannelOptions {
	guildId: string;
	shardId: number;
	channelId: string;
	deaf?: boolean;
	mute?: boolean;
}

// Interfaces are not final, but types are, and therefore has an index signature
// https://stackoverflow.com/a/64970740
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ShoukakuEvents = {
	/**
	 * Emitted when reconnect tries are occurring and how many tries are left
	 * @eventProperty
	 */
	[Events.Reconnecting]: [node: Node, reconnectsLeft: number, reconnectInterval: number];
	/**
	 * Emitted when data useful for debugging is produced
	 * @eventProperty
	 */
	[Events.Debug]: [info: string];
	/**
	 * Emitted when an error occurs
	 * @eventProperty
	 */
	[Events.Error]: [node: Node | NodeOption, error: Error];
	/**
	 * Emitted when Shoukaku is ready to receive operations
	 * @eventProperty
	 */
	[Events.Ready]: [node: Node, lavalinkResume: boolean];
	/**
	 * Emitted when a websocket connection to Lavalink is closed
	 * @eventProperty
	 */
	[Events.Close]: [node: Node, code: number, reason: string];
	/**
	 * Emitted when a websocket connection to Lavalink is Disconnected
	 * @eventProperty
	 */
	[Events.Disconnect]: [node: Node];
	/**
	 * Emitted when a player update event was received from lavalink
	 * @eventProperty
	 */
	[Events.PlayerUpdate]: [node: Node, data: PlayerUpdate];
	/**
	 * Emitted when a player event was received from lavalink
	 * @eventProperty
	 */
	[Events.PlayerEvent]: [node: Node, data: TrackStartEvent | TrackEndEvent | TrackStuckEvent | TrackExceptionEvent | WebSocketClosedEvent];
};

/**
 * Main Shoukaku class
 */
export class Shoukaku extends TypedEventEmitter<Events, ShoukakuEvents> {
	/**
	 * Discord library connector
	 */
	public readonly connector: Connector;
	/**
	 * Shoukaku options
	 */
	public readonly options: Required<OptionalOptions>;
	/**
	 * Connected Lavalink nodes
	 */
	public readonly nodes: Node[];
	/**
	 * Voice connections being handled
	 */
	public readonly connections: Connection[];
	/**
	 * The user id of the user this instance is using
	 */
	public readonly userId: string;
	/**
	 * @param required Required options for shoukaku to function
	 * @param required.userId The user id of the user this instance will connect to
	 * @param required.nodes List of initial nodes that the library will try to connect to
	 * @param required.connectorOptions Options of the connector to communicate with Discord Websocket
	 * @param optional Optional options to pass to create this Shoukaku instance
	 * @param optional.resume Whether to resume a connection on disconnect to Lavalink (Server Side) (Note: DOES NOT RESUME WHEN THE LAVALINK SERVER DIES)
	 * @param optional.resumeTimeout Time to wait before lavalink starts to destroy the players of the disconnected client
	 * @param optional.resumeByLibrary Whether to resume the players by doing it in the library side (Client Side) (Note: TRIES TO RESUME REGARDLESS OF WHAT HAPPENED ON A LAVALINK SERVER)
	 * @param optional.reconnectTries Number of times to try and reconnect to Lavalink before giving up
	 * @param optional.reconnectInterval Timeout before trying to reconnect
	 * @param optional.restTimeout Time to wait for a response from the Lavalink REST API before giving up
	 * @param optional.moveOnDisconnect Whether to move players to a different Lavalink node when a node disconnects
	 * @param optional.userAgent User Agent to use when making requests to Lavalink
	 * @param optional.structures Custom structures for shoukaku to use
	 * @param optional.nodeResolver Used if you have custom lavalink node resolving
	 */
	constructor(required: RequiredOptions, optional: OptionalOptions = {}) {
		super();
		this.connector = new Connector(this, required.connectorOptions);
		this.options = mergeDefault<OptionalOptions>(ShoukakuDefaults, optional);
		this.nodes = [];
		this.connections = [];
		this.userId = required.userId;

		for (const option of required.nodes) {
			this.nodes.push(new Node(this, option));
		}
	}

	/**
	 * @returns The amount of cached player count
	 */
	public getPlayerCount(): number {
		let players = 0;
		for (const node of this.nodes.values()) {
			players += node.stats?.playingPlayers ?? 0;
		}
		return players;
	}

	/**
	 * @returns The latest player count being handled
	 */
	public async fetchPlayerCount(): Promise<number> {
		let players = 0;
		for (const node of this.nodes.values()) {
			const player = await node.rest.getPlayers();
			players += player.length;
		}
		return players;
	}

	/**
	 * Gets an ideal node based on the nodeResolver you provided
	 * @param connection Optional connection class for ideal node selection, if you use it
	 * @returns An ideal node for you to do things with
	 */
	public getIdealNode(connection?: Connection): Node | undefined {
		return this.options.nodeResolver(this.nodes, connection);
	}

	/**
	 * Connects every node that shoukaku manages if it's disconnected
	 */
	public async connect(): Promise<void> {
		await Promise.all(this.nodes.map(node => node.connect()));
	}

	/**
	 * Connects a specific node shoukaku manages if it's disconnected
	 * @param name Node name to connect
	 */
	public async connectNodeNamed(name: string): Promise<void> {
		const node = this.nodes.find(n => n.name === name);

		await node?.connect();
	}

	/**
	 * Add a Lavalink node to the pool of available nodes then tries to connect it
	 * @param options.name Name of this node
	 * @param options.url URL of Lavalink
	 * @param options.auth Credentials to access Lavalnk
	 * @param options.secure Whether to use secure protocols or not
	 * @param options.group Group of this node
	 */
	public async addNode(options: NodeOption): Promise<void> {
		const node = new Node(this, options);

		await node.connect();

		this.nodes.push(node);
	}

	/**
	 * Remove a Lavalink node from the pool of available nodes
	 * @param name Name of the node
	 * @param reason Reason of removing the node
	 */
	public removeNode(name: string, reason = 'Remove node executed'): void {
		const index = this.nodes.findIndex(n => n.name === name);

		if (index === -1)
			throw new Error('The node name you specified doesn\'t exist');

		const node = this.nodes.splice(index, 1)[0];

		node?.destroy(1000, reason);
	}

	/**
	 * Joins a voice channel
	 * @param options.guildId GuildId in which the ChannelId of the voice channel is located
	 * @param options.shardId ShardId to track where this should send on sharded websockets, put 0 if you are unsharded
	 * @param options.channelId ChannelId of the voice channel you want to connect to
	 * @param options.deaf Optional boolean value to specify whether to deafen or undeafen the current bot user
	 * @param options.mute Optional boolean value to specify whether to mute or unmute the current bot user
	 * @returns The created player
	 */
	public async joinVoiceChannel(options: VoiceChannelOptions): Promise<Player> {
		if (this.connections.some(conn => conn.guildId === options.guildId))
			throw new Error('This guild already have an existing connection');

		const connection = new Connection(this, options);

		this.connections.push(connection);

		try {
			await connection.connect();
		} catch (error) {
			this.deleteConnection(options.guildId);
			throw error;
		}

		const cleanup = () => {
			connection.disconnect();
			this.deleteConnection(options.guildId);
		};

		const node = this.getIdealNode(connection);
		if (!node) {
			cleanup();
			throw new Error('Can\'t find any nodes to connect on');
		}

		try {
			await node.rest.updatePlayer(options.guildId, {
				voice: {
					token: connection.serverUpdate!.token,
					endpoint: connection.serverUpdate!.endpoint,
					sessionId: connection.sessionId!
				}
			});
		} catch (error) {
			cleanup();
			throw error;
		}

		node.connections.add(connection);

		return this.options.structures.player ? new this.options.structures.player(connection.guildId, node) : new Player(connection.guildId, node);
	}

	/**
	 * Leaves a voice channel
	 * @param guildId The id of the guild you want to delete
	 * @returns The destroyed / disconnected player or undefined if none
	 */
	public leaveVoiceChannel(guildId: string): void {
		const connection = this.connections.find(conn => conn.guildId === guildId);
		connection?.disconnect();

		this.deleteConnection(guildId);
	}

	/**
	 * Leaves current voice channel and joins a new one
	 * @param guildId GuildId in which the ChannelId of the voice channel is located
	 * @param channelId Id of channel to move to
	 * @throws {@link Error} When guild does not have an existing connection, or could not be moved
	 * @returns The moved player
	 */
	public moveVoiceChannel(guildId: string, channelId: string) {
		const connection = this.connections.find(conn => conn.guildId === guildId);

		if (!connection)
			throw new Error('This guild does not have an existing connection');

		if (connection.channelId === channelId) return;

		connection.setStateUpdate({
			session_id: connection.sessionId!,
			channel_id: channelId,
			self_deaf: connection.deafened,
			self_mute: connection.muted
		});

		connection.sendVoiceUpdate();
	}

	/**
	 * Deletes a connection from array
	 * @param guildId
	 * @internal
	 */
	public deleteConnection(guildId: string): Connection | undefined {
		const index = this.connections.findIndex(conn => conn.guildId === guildId);

		if (index === -1) return;

		return this.connections.splice(index, 1)[0];
	}
}
