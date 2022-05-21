import { EventEmitter } from 'events';
import { IncomingMessage } from 'http';
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

export interface ResumableHeaders {
    [key: string]: string;
    'Client-Name': string;
    'User-Agent': string;
    'Authorization': string;
    'User-Id': string;
    'Resume-Key': string;
}

export interface NonResumableHeaders {
    [key: string]: string;
    'Client-Name': string;
    'User-Agent': string;
    'Authorization': string;
    'User-Id': string;
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

    public connect(reconnect = false): void {
        if (!this.manager.id) throw new Error('Do not connect a node when the library is not yet ready');
        this.destroyed = false;
        this.state = State.CONNECTING;
        let headers: ResumableHeaders|NonResumableHeaders;
        if (reconnect && (this.manager.options.resume && this.manager.options.resumeKey)) {
            headers = {
                'Client-Name': this.manager.options.userAgent,
                'User-Agent': this.manager.options.userAgent,
                'Authorization': this.auth,
                'User-Id': this.manager.id,
                'Resume-Key': this.manager.options.resumeKey
            };
        } else {
            headers = {
                'Client-Name': this.manager.options.userAgent,
                'User-Agent': this.manager.options.userAgent,
                'Authorization': this.auth,
                'User-Id': this.manager.id
            };
        }
        this.emit('debug', this.name, `[Socket] -> [${this.name}] : Connecting ${this.url}`);
        this.ws = new Websocket(this.url, { headers } as Websocket.ClientOptions);
        this.ws.once('upgrade', response => this.ws!.once('open', () => this.open(response, reconnect)));
        this.ws.once('close', (...args) => this.close(...args));
        this.ws.on('error', error => this.emit('error', this.name, error));
        this.ws.on('message', data => this.message(data));
    }

    public disconnect(code: number, reason?:string): void {
        if (this.destroyed) return;
        this.destroyed = true;
        this.state = State.DISCONNECTING;
        this.clean();
        this.queue.flush(code, reason);
    }

    public async joinChannel(options: VoiceChannelOptions): Promise<Player> {
        if (this.state !== State.CONNECTED)
            throw new Error('This node is not yet ready');
        let player = this.players.get(options.guildId);
        if (player?.connection.state === State.CONNECTING)
            throw new Error('Can\'t join this channel. This connection is connecting');
        if (player?.connection.state === State.CONNECTED)
            throw new Error('Can\'t join this channel. This connection is already connected');
        if (player?.connection.reconnecting)
            throw new Error('Can\'t join this channel. This connection is currently force-reconnecting');
        try {
            if (!player) {
                player = new Player(this, options);
                this.players.set(options.guildId, player);
            }
            await player.connection.connect(options);
            return player;
        } catch (error) {
            this.players.delete(options.guildId);
            throw error;
        }
    }

    public leaveChannel(guildId: string): void {
        this.players.get(guildId)?.connection.disconnect();
    }

    private open(response: IncomingMessage, reconnect = false): void {
        const resumed = response.headers['session-resumed'] === 'true';
        this.queue.add();
        if (this.manager.options.resume && this.manager.options.resumeKey) {
            this.queue.add({
                op: 'configureResuming',
                key: this.manager.options.resumeKey,
                timeout: this.manager.options.resumeTimeout
            });
        }
        if (!resumed && reconnect) {
            for (const player of [...this.players.values()]) {
                player.connection.resendServerUpdate();
                player.resume();
            }
        }
        this.reconnects = 0;
        this.state = State.CONNECTED;
        this.emit('debug', this.name, `[Socket] <-> [${this.name}] : Connection Open ${this.url} | Resumed: ${!resumed && reconnect ? reconnect : resumed}`);
        this.emit('ready', this.name, !resumed && reconnect ? reconnect : resumed);
    }

    private message(message: any): void {
        const json = JSON.parse(message);
        if (!json) return;
        if (json.op === 'stats') {
            this.emit('debug', this.name, `[Socket] <- [${this.name}] : Node Status Update | Server Load: ${this.penalties}`);
            this.stats = json;
            return;
        }
        this.players.get(json.guildId)?.onLavalinkMessage(json);
    }

    private close(code: number, reason: Buffer): void {
        this.state = State.DISCONNECTED;
        this.emit('debug', this.name, `[Socket] <-/-> [${this.name}] : Connection Closed, Code: ${code || 'Unknown Code'}`);
        this.ws?.removeAllListeners();
        this.ws = null;
        this.emit('close', this.name, code, reason);
        if (this.destroyed || this.reconnects >= this.manager.options.reconnectTries)
            this.clean();
        else
            this.reconnect();
    }

    private clean(): void {
        const players = [...this.players.values()];
        const move = this.manager.options.moveOnDisconnect && [...this.manager.nodes.values()].filter(node => node.group === this.group).length > 1;
        for (const player of players) {
            if (!move) {
                player.connection.disconnect();
                continue;
            }
            const name = this.group ? [this.group] : 'auto';
            const node = this.manager.getNode(name);
            if (!node) {
                player.connection.disconnect();
                continue;
            }
            player.move(node.name);
        }
        this.queue.clear();
        this.manager.nodes.delete(this.name);
        this.emit('disconnect', this.name, players, players.length > 0 && move);
    }

    private reconnect(): void {
        if (this.state !== State.DISCONNECTED) return;
        this.reconnects++;
        this.emit('debug', this.name, `[Socket] -> [${this.name}] : Reconnecting. ${this.manager.options.reconnectTries - this.reconnects} tries left`);
        setTimeout(() => this.connect(true), this.manager.options.reconnectInterval);
    }

    public discordRaw(packet: any): void {
        const player = this.players.get(packet.d.guild_id);
        if (!player) return;
        if (packet.t === 'VOICE_SERVER_UPDATE') {
            player.connection.setServerUpdate(packet.d);
            return;
        }
        if (packet.d.user_id !== this.manager.id) return;
        player.connection.setStateUpdate(packet.d);
    }
}
