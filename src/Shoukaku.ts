import { EventEmitter } from 'events';
import { State, ShoukakuDefaults } from './Constants';
import { Node } from './node/Node';
import { Connector } from './connectors/Connector';
import { mergeDefault } from './Utils';
import { Player } from './guild/Player';

export interface NodeOption {
    name: string;
    url: string;
    auth: string;
    secure?: boolean;
    group?: string;
}

export interface ShoukakuOptions {
    resume?: boolean;
    resumeKey?: string;
    resumeTimeout?: number;
    reconnectTries?: number;
    reconnectInterval?: number;
    restTimeout?: number;
    moveOnDisconnect?: boolean;
    userAgent?: string;
}

export interface MergedShoukakuOptions {
    resume: boolean;
    resumeKey: string;
    resumeTimeout: number;
    reconnectTries: number;
    reconnectInterval: number;
    restTimeout: number;
    moveOnDisconnect: boolean;
    userAgent: string;
}

export declare interface Shoukaku {
    on(event: 'debug', listener: (name: string, info: string) => void): this;
    on(event: 'error', listener: (name: string, error: Error) => void): this;
    on(event: 'ready', listener: (name: string, reconnected: boolean) => void): this;
    on(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    on(event: 'disconnect', listener: (name: string, players: Player[], moved: boolean) => void): this;
    once(event: 'debug', listener: (name: string, info: string) => void): this;
    once(event: 'error', listener: (name: string, error: Error) => void): this;
    once(event: 'ready', listener: (name: string, reconnected: boolean) => void): this;
    once(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    once(event: 'disconnect', listener: (name: string, players: Player[], moved: boolean) => void): this;
    off(event: 'debug', listener: (name: string, info: string) => void): this;
    off(event: 'error', listener: (name: string, error: Error) => void): this;
    off(event: 'ready', listener: (name: string, reconnected: boolean) => void): this;
    off(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    off(event: 'disconnect', listener: (name: string, players: Player[], moved: boolean) => void): this;
}

export class Shoukaku extends EventEmitter {
    public readonly connector: Connector;
    public readonly options: MergedShoukakuOptions;
    public readonly nodes: Map<string, Node>;
    public id: string|null;
    constructor(connector: any, nodes: NodeOption[], options: ShoukakuOptions) {
        super();
        this.connector = connector;
        this.options = mergeDefault(ShoukakuDefaults, options);
        this.nodes = new Map();
        this.id = null;
        this.connector.listen(nodes);
    }

    get players(): Map<string, Player> {
        const players = new Map();
        for (const node of this.nodes.values()) {
            for (const [id, player] of node.players) players.set(id, player);
        }
        return players;
    }

    public addNode(options: NodeOption): void {
        const node = new Node(this, options);
        node.on('debug', (...args) => this.emit('debug', ...args));
        node.on('error', (...args) => this.emit('error', ...args));
        node.on('close', (...args) => this.emit('close', ...args));
        node.on('ready', (...args) => this.emit('ready', ...args));
        node.on('disconnect', (...args) => this.emit('ready', ...args));
        node.connect();
        this.nodes.set(node.name, node);
    }

    public removeNode(name: string, reason = 'Remove node executed'): void {
        const node = this.nodes.get(name);
        if (!node) throw new Error('The node name you specified doesn\'t exist');
        node.disconnect(1000, reason);
        node.removeAllListeners();
    }

    public getNode(name: string|string[] = 'auto'): Node|undefined {
        if (!this.nodes.size) throw new Error('No nodes available, please add a node first');
        if (Array.isArray(name)) return this.getIdeal(name);
        const node = this.nodes.get(name);
        if (!node) throw new Error('The node name you specified is not one of my nodes');
        if (node.state !== State.CONNECTED) throw new Error('This node is not yet ready');
        return node;
    }

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
