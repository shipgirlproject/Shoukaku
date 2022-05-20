import { EventEmitter } from 'events';
import { NodeOption, Shoukaku } from '../Shoukaku';
import { Player } from '../guild/Player';
import { State } from '../Constants';
import { Queue } from './Queue';
import { Rest } from './Rest';
import Websocket from 'ws';


export interface VoiceChannelOptions {
    guildId: string;
    shardId: number;
    channelId: string;
    deaf?: boolean;
    mute?: boolean;
}

export interface NodeStats {
    players: number;
    playingPlayers: number;
    memory: {
        reservable: number;
        used: number;
        free: number;
        allocated: number
    };
    frameStats: {
        sent: number;
        deficit: number;
        nulled: number
    };
    cpu: {
        cores: number;
        systemLoad: number;
        lavalinkLoad: number;
    };
    uptime: number;
}

export class Node extends EventEmitter {
    public readonly manager: Shoukaku;
    public readonly players: Map<string, Player>;
    public readonly rest: Rest;
    public readonly queue: Queue;
    public readonly name: string;
    public readonly group?: string;
    private readonly url: string;
    private readonly auth: string;
    public reconnects: number;
    public destroyed: boolean;
    public state: State;
    public stats: NodeStats|null;
    public ws: Websocket|null;

    constructor(manager: Shoukaku, options: NodeOption) {
        super();
        this.manager = manager;
        this.players = new Map();
        this.rest = new Rest(this, options);
        this.queue = new Queue(this);
        this.name = options.name;
        this.group = options.group;
        this.url = `${options.secure ? 'wss' : 'ws'}://${options.url}`;
        this.auth = options.auth;
        this.reconnects = 0;
        this.destroyed = false;
        this.state = State.DISCONNECTED;
        this.stats = null;
        this.ws = null;
    }

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
}