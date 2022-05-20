import { EventEmitter } from 'events';
import { State } from './Constants';
import { Node } from './node/Node';
import { Connector } from './connectors/Connector';
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

export class Shoukaku extends EventEmitter {
    public readonly connector: Connector;
    public readonly options: ShoukakuOptions;
    public readonly nodes: Map<string, Node>;
    public id: string|null;
    constructor(connector: any, nodes: NodeOption[], options: ShoukakuOptions) {
        super();
        this.connector = connector;
        this.options = options;
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
        node.on('disconnect', (...args) => this.clean(...args));
        // node.connect();
        this.nodes.set(node.name, node);
    }

    public removeNode(name: string, reason: string = 'Remove node executed'): void {
        const node = this.nodes.get(name);
        if (!node) throw new Error('The node name you specified doesn\'t exist');
        // node.disconnect(1000, reason);
        node.removeAllListeners();
    }

    public getNode(name: string) {
        if (!this.nodes.size) throw new Error('No nodes available, please add a node first');
        if (Array.isArray(name)) return this.getIdeal(name);
        const node = this.nodes.get(name);
        if (!node) throw new Error('The node name you specified is not one of my nodes');
        if (node.state !== State.CONNECTED) throw new Error('This node is not yet ready');
        return node;
    }

    public getIdeal(group?: string) {
        const nodes = [...this.nodes.values()]
            .filter(node => node.state === State.CONNECTED);
        if (!group) {
            return nodes
                .sort((a, b) => a.penalties - b.penalties)
                .shift();
        }
        return nodes
            .filter(node => node.group && group.includes(node.group))
            .sort((a, b) => a.penalties - b.penalties)
            .shift();
    }

    public clean(name: string, players: [], moved: boolean): void {
        this.nodes.delete(name);
        this.emit('disconnect', name, players, moved);
    }
}
