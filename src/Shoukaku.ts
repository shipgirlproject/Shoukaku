import { EventEmitter } from 'events';
import { State, ShoukakuDefaults } from './Constants';
import { Node } from './node/Node';
import { Connector } from './connectors/Connector';
import { Constructor, mergeDefault } from './Utils';
import { Player } from './guild/Player';
import { Rest } from './node/Rest';

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
     * Credentials to access Lavalnk
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
     * Resume key for Lavalink
     */
    resumeKey?: string;
    /**
     * Time to wait before lavalink starts to destroy the players of the disconnected client
     */
    resumeTimeout?: number;
    /**
     * Whether to resume the players by doing it in the library side (Client Side) (Note: TRIES TO RESUME REGARDLESS OF WHAT HAPPENED ON A LAVALINK SERVER)
     */
    resumeByLibrary?: boolean;
    /**
     * Disables the first time initialization tracking of nodes, and just sends the resume key always (Note: Useful for people who save their players to redis and wants to resume sessions even at first boot)
     */
    alwaysSendResumeKey?: boolean;
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
}

export interface MergedShoukakuOptions {
    resume: boolean;
    resumeKey: string;
    resumeTimeout: number;
    resumeByLibrary: boolean;
    alwaysSendResumeKey: boolean;
    reconnectTries: number;
    reconnectInterval: number;
    restTimeout: number;
    moveOnDisconnect: boolean;
    userAgent: string;
    structures: Structures;
}

export declare interface Shoukaku {
    /**
     * Emitted when reconnect tries are occurring and how many tries are left
     * @eventProperty
     */
    on(event: 'reconnecting', listener: (name: string, info: string, tries: number, triesLeft: number, reconnectInterval: number) => void): this;
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
     * Emitted when Shoukaku is ready to recieve operations
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
    on(event: 'rawEvents', listener: (json: any) => void): this;
    once(event: 'reconnecting', listener: (name: string, reconnectsLeft: number, reconnectInterval: number) => void): this;
    once(event: 'debug', listener: (name: string, info: string) => void): this;
    once(event: 'error', listener: (name: string, error: Error) => void): this;
    once(event: 'ready', listener: (name: string, reconnected: boolean) => void): this;
    once(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    once(event: 'disconnect', listener: (name: string, players: Player[], moved: boolean) => void): this;
    once(event: 'rawEvents', listener: (json: any) => void): this;
    off(event: 'reconnecting', listener: (name: string, reconnectsLeft: number, reconnectInterval: number) => void): this;
    off(event: 'debug', listener: (name: string, info: string) => void): this;
    off(event: 'error', listener: (name: string, error: Error) => void): this;
    off(event: 'ready', listener: (name: string, reconnected: boolean) => void): this;
    off(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    off(event: 'disconnect', listener: (name: string, players: Player[], moved: boolean) => void): this;
    off(event: 'rawEvents', listener: (json: any) => void): this;
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
    public readonly options: MergedShoukakuOptions;
    /**
     * Connected Lavalink nodes
     */
    public readonly nodes: Map<string, Node>;
    /**
     * Shoukaku instance identifier
     */
    public id: string|null;
    /**
     * @param connector A Discord library connector
     * @param nodes An array that conforms to the NodeOption type that specifies nodes to connect to
     * @param options.resume Whether to resume a connection on disconnect to Lavalink (Server Side) (Note: DOES NOT RESUME WHEN THE LAVALINK SERVER DIES)
     * @param options.resumeKey Resume key for Lavalink
     * @param options.resumeTimeout Time to wait before lavalink starts to destroy the players of the disconnected client
     * @param options.resumeByLibrary Whether to resume the players by doing it in the library side (Client Side) (Note: TRIES TO RESUME REGARDLESS OF WHAT HAPPENED ON A LAVALINK SERVER)
     * @param options.alwaysSendResumeKey Disables the first time initialization tracking of nodes, and just sends the resume key always (Note: Useful for people who save their players to redis and wants to resume sessions even at first boot)
     * @param options.reconnectTries Number of times to try and reconnect to Lavalink before giving up
     * @param options.reconnectInterval Timeout before trying to reconnect
     * @param options.restTimeout Time to wait for a response from the Lavalink REST API before giving up
     * @param options.moveOnDisconnect Whether to move players to a different Lavalink node when a node disconnects
     * @param options.userAgent User Agent to use when making requests to Lavalink
     * @param options.structures Custom structures for shoukaku to use
     */
    constructor(connector: Connector, nodes: NodeOption[], options: ShoukakuOptions = {}) {
        super();
        this.connector = connector.set(this);
        this.options = mergeDefault(ShoukakuDefaults, options);
        this.nodes = new Map();
        this.id = null;
        this.connector.listen(nodes);
    }

    /**
     * Get a list of players
     * @returns A map of guild IDs and players
     * @readonly
     */
    get players(): Map<string, Player> {
        const players = new Map();
        for (const node of this.nodes.values()) {
            for (const [id, player] of node.players) players.set(id, player);
        }
        return players;
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
        node.on('debug', (...args) => this.emit('debug', ...args));
        node.on('reconnecting', (...args) => this.emit('reconnecting', ...args));
        node.on('error', (...args) => this.emit('error', ...args));
        node.on('close', (...args) => this.emit('close', ...args));
        node.on('ready', (...args) => this.emit('ready', ...args));
        node.on('disconnect', (...args) => this.emit('disconnect', ...args));
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
        node.removeAllListeners();
    }

    /**
     * Select a Lavalink node from the pool of nodes
     * @param name A specific node, an array of nodes, or the string `auto`
     * @returns A Lavalink node or undefined
     */
    public getNode(name: string|string[] = 'auto'): Node|undefined {
        if (!this.nodes.size) throw new Error('No nodes available, please add a node first');
        if (Array.isArray(name) || name === 'auto') return this.getIdeal(name);
        const node = this.nodes.get(name);
        if (!node) throw new Error('The node name you specified is not one of my nodes');
        if (node.state !== State.CONNECTED) throw new Error('This node is not yet ready');
        return node;
    }

    /**
     * Get the Lavalink node the least penalty score
     * @param group A group, an array of groups, or the string `auto`
     * @returns A Lavalink node or undefined
     * @internal
     */
    private getIdeal(group: string|string[]): Node|undefined {
        const nodes = [...this.nodes.values()]
            .filter(node => node.state === State.CONNECTED);
        if (group === 'auto') {
            return nodes
                .sort((a, b) => a.penalties - b.penalties)
                .shift();
        }
        return nodes
            .filter(node => node.group && group.includes(node.group))
            .sort((a, b) => a.penalties - b.penalties)
            .shift();
    }
}
