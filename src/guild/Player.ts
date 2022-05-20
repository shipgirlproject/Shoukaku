import { EventEmitter } from 'events';
import { Node, VoiceChannelOptions } from '../node/Node';
import { State } from '../Constants';
import { Connection } from './Connection';

export interface PlayOptions {
    track: string;
    options?: {
        noReplace?: boolean;
        pause?: boolean;
        startTime?: number;
        endTime: number;
    }
}

export class Player extends EventEmitter {
    public node: Node;
    public readonly connection: Connection;
    public track: string|null;
    public paused: boolean;
    public position: number;
    public filters: any|null;
    constructor(node: Node, options: VoiceChannelOptions) {
        super();
        this.node = node;
        this.connection = new Connection(this, options);
        this.track = null;
        this.paused = false;
        this.position = 0;
        this.filters = null;
    }

    move(name: string): Player {
        const node = this.node.manager.nodes.get(name);
        if (!node || node.name === this.node.name) return this;
        if (node.state !== State.CONNECTED) throw new Error('The node you specified is not ready');
        this.connection.destroyLavalinkPlayer();
        this.node.players.delete(this.connection.guildId);
        this.node = node;
        this.node.players.set(this.connection.guildId, this);
        this.connection.resendServerUpdate();
        // this.resume();
        return this;
    }
}