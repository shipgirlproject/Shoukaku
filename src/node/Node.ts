import { EventEmitter } from 'events';
import { IncomingMessage } from 'http';
import { NodeOption, Shoukaku } from '../Shoukaku';
import { Player } from '../guild/Player';
import { OPCodes, State } from '../Constants';
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

/**
 * Represents a Lavalink node
 */
export class Node extends EventEmitter {
    /**
     * Shoukaku class
     * @readonly
     */
    public readonly manager: Shoukaku;
    /**
     * A map of guild ID to players
     */
    public readonly players: Map<string, Player>;
    /**
     * Lavalink rest API
     */
    public readonly rest: Rest;
    /**
     * Lavalink API message queue
     */
    public readonly queue: Queue;
    /**
     * Name of this node
     */
    public readonly name: string;
    /**
     * Group in which this node is contained
     */
    public readonly group?: string;
    /**
     * URL of Lavalink
     * @readonly
     */
    private readonly url: string;
    /**
     * Credentials to access Lavalink
     * @readonly
     */
    private readonly auth: string;
    /**
     * The number of reconnects to Lavalink
     */
    public reconnects: number;
    /**
     * Boolean that represents if this connection is destroyed
     */
    public destroyed: boolean;
    /**
     * The state of this connection
     */
    public state: State;
    /**
     * Statistics from Lavalink
     */
    public stats: NodeStats|null;
    /**
     * Websocket instance
     */
    public ws: Websocket|null;
    /**
     * @param manager Shoukaku instance
     * @param options.name Name of this node
     * @param options.url URL of Lavalink
     * @param options.auth Credentials to access Lavalnk
     * @param options.secure Whether to use secure protocols or not
     * @param options.group Group of this node
     */
    constructor(manager: Shoukaku, options: NodeOption) {
        super();
        this.manager = manager;
        this.players = new Map();
        this.rest = new (this.manager.options.structures.rest || Rest)(this, options);
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

    /**
     * Penalties for load balancing
     * @returns Penalty score
     * @static @internal @readonly
     */
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

    /**
     * Connect to Lavalink
     * @param reconnect Whether to reconnect on failure or not
     */
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

    /**
     * Disconnect from lavalink
     * @param code Status code
     * @param reason Reason for disconnect
     */
    public disconnect(code: number, reason?:string): void {
        if (this.destroyed) return;
        this.destroyed = true;
        this.state = State.DISCONNECTING;
        this.clean();
        this.queue.flush(code, reason);
    }

    /**
     * Join a voice channel in a guild
     * @param options.guildId Guild ID in which voice channel to connect to is located
     * @param options.shardId Shard ID in which the guild exists
     * @param options.channelId Channel ID of voice channel to connect to
     * @param options.deaf Optional boolean value to specify whether to deafen the current bot user
     * @param options.mute Optional boolean value to specify whether to mute the current bot user
     * @returns A promise that resolves to a player class
     */
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
                if (this.manager.options.structures.player) {
                    player = new this.manager.options.structures.player(this, options);
                } else {
                    player = new Player(this, options);
                }
                this.players.set(options.guildId, player!);
            }
            await player!.connection.connect(options);
            return player!;
        } catch (error) {
            this.players.delete(options.guildId);
            throw error;
        }
    }

    /**
     * Disconnect from connected voice channel
     * @param guildId ID of guild that contains voice channel
     */
    public leaveChannel(guildId: string): void {
        this.players.get(guildId)?.connection.disconnect();
    }

    /**
     * Handle connection open event from Lavalink
     * @param response Response from Lavalink
     * @param reconnect Whether to reconnect on failure
     * @internal
     */
    private open(response: IncomingMessage, reconnect = false): void {
        const resumed = response.headers['session-resumed'] === 'true';
        this.queue.add();
        if (this.manager.options.resume && this.manager.options.resumeKey) {
            this.queue.add({
                op: OPCodes.CONFIGURE_RESUMING,
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

    /**
     * Handle message from Lavalink
     * @param message JSON message
     * @internal
     */
    private message(message: any): void {
        const json = JSON.parse(message);
        if (!json) return;
        if (json.op === OPCodes.STATS) {
            this.emit('debug', this.name, `[Socket] <- [${this.name}] : Node Status Update | Server Load: ${this.penalties}`);
            this.stats = json;
            return;
        }
        this.players.get(json.guildId)?.onLavalinkMessage(json);
    }

    /**
     * Handle closed event from laavlink
     * @param code Status close
     * @param reason Reason for connection close
     */
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

    /**
     * Clear message queue and move players to other nodes if possible
     * @internal
     */
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

    /**
     * Reconnect to Lavalink
     * @internal
     */
    private reconnect(): void {
        if (this.state !== State.DISCONNECTED) return;
        this.reconnects++;
        this.emit('debug', this.name, `[Socket] -> [${this.name}] : Reconnecting. ${this.manager.options.reconnectTries - this.reconnects} tries left`);
        setTimeout(() => this.connect(true), this.manager.options.reconnectInterval);
    }

    /**
     * Handle raw message from Discord
     * @param packet Packet data
     * @internal
     */
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
