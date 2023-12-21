import { EventEmitter } from 'events';
import { ShoukakuDefaults, VoiceState } from './Constants';
import { Node } from './node/Node';
import { Connector } from './connectors/Connector';
import { Constructor, mergeDefault } from './Utils';
import { Player } from './guild/Player';
import { Rest } from './node/Rest';
import { Connection } from './guild/Connection.js';

export interface Structures {
    /**
     * A custom structure that extends the Rest class
     */
    rest?:  Constructor<Rest>;
    /**
     * A custom structure that extends the Player class
     */
    player?: Constructor<Player>;
}

export interface NodeOption {
    /**
     * Name of this node
     */
    name: string;
    /**
     * URL of Lavalink
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
     * Group of this node
     */
    group?: string;
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
    nodeResolver?: (nodes: Map<string, Node>, connection?: Connection) => Node|undefined;
}

export interface VoiceChannelOptions {
    guildId: string;
    shardId: number;
    channelId: string;
    deaf?: boolean;
    mute?: boolean;
}

export declare interface Shoukaku {
    /**
     * Emitted when reconnect tries are occurring and how many tries are left
     * @eventProperty
     */
    on(event: 'reconnecting', listener: (name: string, reconnectsLeft: number, reconnectInterval: number) => void): this;
    /**
     * Emitted when data useful for debugging is produced
     * @eventProperty
     */
    on(event: 'debug', listener: (name: string, info: string) => void): this;
    /**
     * Emitted when an error occurs
     * @eventProperty
     */
    on(event: 'error', listener: (name: string, error: Error) => void): this;
    /**
     * Emitted when Shoukaku is ready to receive operations
     * @eventProperty
     */
    on(event: 'ready', listener: (name: string, reconnected: boolean) => void): this;
    /**
     * Emitted when a websocket connection to Lavalink closes
     * @eventProperty
     */
    on(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    /**
     * Emitted when a websocket connection to Lavalink disconnects
     * @eventProperty
     */
    on(event: 'disconnect', listener: (name: string, count: number) => void): this;
    /**
     * Emitted when a raw message is received from Lavalink
     * @eventProperty
     */
    on(event: 'raw', listener: (name: string, json: unknown) => void): this;
    once(event: 'reconnecting', listener: (name: string, reconnectsLeft: number, reconnectInterval: number) => void): this;
    once(event: 'debug', listener: (name: string, info: string) => void): this;
    once(event: 'error', listener: (name: string, error: Error) => void): this;
    once(event: 'ready', listener: (name: string, reconnected: boolean) => void): this;
    once(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    once(event: 'disconnect', listener: (name: string, count: number) => void): this;
    once(event: 'raw', listener: (name: string, json: unknown) => void): this;
    off(event: 'reconnecting', listener: (name: string, reconnectsLeft: number, reconnectInterval: number) => void): this;
    off(event: 'debug', listener: (name: string, info: string) => void): this;
    off(event: 'error', listener: (name: string, error: Error) => void): this;
    off(event: 'ready', listener: (name: string, reconnected: boolean) => void): this;
    off(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    off(event: 'disconnect', listener: (name: string, count: number) => void): this;
    off(event: 'raw', listener: (name: string, json: unknown) => void): this;
}

/**
 * Main Shoukaku class
 */
export class Shoukaku extends EventEmitter {
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
    public id: string|null;
    /**
     * @param connector A Discord library connector
     * @param nodes An array that conforms to the NodeOption type that specifies nodes to connect to
     * @param options Options to pass to create this Shoukaku instance
     * @param options.resume Whether to resume a connection on disconnect to Lavalink (Server Side) (Note: DOES NOT RESUME WHEN THE LAVALINK SERVER DIES)
     * @param options.resumeTimeout Time to wait before lavalink starts to destroy the players of the disconnected client
     * @param options.resumeByLibrary Whether to resume the players by doing it in the library side (Client Side) (Note: TRIES TO RESUME REGARDLESS OF WHAT HAPPENED ON A LAVALINK SERVER)
     * @param options.reconnectTries Number of times to try and reconnect to Lavalink before giving up
     * @param options.reconnectInterval Timeout before trying to reconnect
     * @param options.restTimeout Time to wait for a response from the Lavalink REST API before giving up
     * @param options.moveOnDisconnect Whether to move players to a different Lavalink node when a node disconnects
     * @param options.userAgent User Agent to use when making requests to Lavalink
     * @param options.structures Custom structures for shoukaku to use
     * @param options.nodeResolver Used if you have custom lavalink node resolving
     */
    constructor(connector: Connector, nodes: NodeOption[], options: ShoukakuOptions = {}) {
        super();
        this.connector = connector.set(this);
        this.options = mergeDefault(ShoukakuDefaults, options);
        this.nodes = new Map();
        this.connections = new Map();
        this.players = new Map();
        this.id = null;
        this.connector.listen(nodes);
    }

    /**
     * Add a Lavalink node to the pool of available nodes
     * @param options.name Name of this node
     * @param options.url URL of Lavalink
     * @param options.auth Credentials to access Lavalnk
     * @param options.secure Whether to use secure protocols or not
     * @param options.group Group of this node
     */
    public addNode(options: NodeOption): void {
        const node = new Node(this, options);
        node.on('debug', (...args) => this.emit('debug', node.name, ...args));
        node.on('reconnecting', (...args) => this.emit('reconnecting', node.name, ...args));
        node.on('error', (...args) => this.emit('error', node.name, ...args));
        node.on('close', (...args) => this.emit('close', node.name, ...args));
        node.on('ready', (...args) => this.emit('ready', node.name, ...args));
        node.on('raw', (...args) => this.emit('raw', node.name, ...args));
        node.once('disconnect', (...args) => this.clean(node, ...args));
        node.connect();
        this.nodes.set(node.name, node);
    }

    /**
     * Remove a Lavalink node from the pool of available nodes
     * @param name Name of the node
     * @param reason Reason of removing the node
     */
    public removeNode(name: string, reason = 'Remove node executed'): void {
        const node = this.nodes.get(name);
        if (!node) throw new Error('The node name you specified doesn\'t exist');
        node.disconnect(1000, reason);
    }

    /**
     * Joins a voice channel
     * @param options.guildId GuildId in which the ChannelId of the voice channel is located
     * @param options.shardId ShardId to track where this should send on sharded websockets, put 0 if you are unsharded
     * @param options.channelId ChannelId of the voice channel you want to connect to
     * @param options.deaf Optional boolean value to specify whether to deafen or undeafen the current bot user
     * @param options.mute Optional boolean value to specify whether to mute or unmute the current bot user
     * @returns The created player
     * @internal
     */
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
            const node = this.options.nodeResolver(this.nodes, connection);
            if (!node)
                throw new Error('Can\'t find any nodes to connect on');
            const player = this.options.structures.player ? new this.options.structures.player(connection.guildId, node) : new Player(connection.guildId, node);
            const onUpdate = (state: VoiceState) => {
                if (state !== VoiceState.SESSION_READY) return;
                player.sendServerUpdate(connection);
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

    /**
     * Leaves a voice channel
     * @param guildId The id of the guild you want to delete
     * @returns The destroyed / disconnected player or undefined if none
     * @internal
     */
    public async leaveVoiceChannel(guildId: string): Promise<void> {
        const connection = this.connections.get(guildId);
        if (connection) {
            connection.disconnect();
            this.connections.delete(guildId);
        }
        const player = this.players.get(guildId);
        if (player) {
            await player.destroy();
            player.clean();
            this.players.delete(guildId);
        }
    }

    /**
     * Cleans the disconnected lavalink node
     * @param node The node to clean
     * @param args Additional arguments for Shoukaku to emit
     * @returns A Lavalink node or undefined
     * @internal
     */
    private clean(node: Node, ...args: unknown[]): void {
        node.removeAllListeners();
        this.nodes.delete(node.name);
        this.emit('disconnect', node.name, ...args);
    }
}
