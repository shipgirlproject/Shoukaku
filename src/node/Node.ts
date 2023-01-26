import { EventEmitter } from 'events';
import { IncomingMessage } from 'http';
import { NodeOption, Shoukaku } from '../Shoukaku';
import { Player } from '../guild/Player';
import { OPCodes, State, Versions } from '../Constants';
import { wait } from '../Utils';
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
     * Name of this node
     */
    public readonly name: string;
    /**
     * Group in which this node is contained
     */
    public readonly group?: string;
    /**
     * Websocket version this node will use
     */
    public readonly version: string;
    /**
     * URL of Lavalink
     */
    private readonly url: string;
    /**
     * Credentials to access Lavalink
     */
    private readonly auth: string;
    /**
     * The number of reconnects to Lavalink
     */
    public reconnects: number;
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
     * SessionId of this Lavalink connection (not to be confused with Discord SessionId)
     */
    public sessionId: string|null;
    /**
     * Boolean that represents if the node has initialized once (will always be true when alwaysSendResumeKey is true)
     */
    protected initialized: boolean;
    /**
     * Boolean that represents if this connection is destroyed
     */
    protected destroyed: boolean;
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
        this.name = options.name;
        this.group = options.group;
        this.version = `/v${Versions.WEBSOCKET_VERSION}`;
        this.url = `${options.secure ? 'wss' : 'ws'}://${options.url}`;
        this.auth = options.auth;
        this.reconnects = 0;
        this.state = State.DISCONNECTED;
        this.stats = null;
        this.ws = null;
        this.sessionId = null;
        this.initialized = this.manager.options.alwaysSendResumeKey ?? false;
        this.destroyed = false;
    }

    /**
     * Penalties for load balancing
     * @returns Penalty score
     * @internal @readonly
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
     * If we should clean this node
     * @internal @readonly
     */
    private get shouldClean(): boolean {
        return this.destroyed || this.reconnects >= this.manager.options.reconnectTries;
    }

    /**
     * Connect to Lavalink
     */
    public connect(): void {
        if (!this.manager.id) throw new Error('Don\'t connect a node when the library is not yet ready');
        if (this.destroyed) throw new Error('You can\'t re-use the same instance of a node once disconnected, please re-add the node again');

        const resume = this.initialized && (this.manager.options.resume && this.manager.options.resumeKey);
        this.state = State.CONNECTING;
        let headers: ResumableHeaders|NonResumableHeaders;

        if (resume) {
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

        this.emit('debug', `[Socket] -> [${this.name}] : Connecting ${this.url}, Version: ${this.version}, Trying to resume? ${resume}`);

        if (!this.initialized) this.initialized = true;

        const url = new URL(`${this.url}${this.version}/websocket`);

        this.ws = new Websocket(url.toString(), { headers } as Websocket.ClientOptions);
        this.ws.once('upgrade', response => this.open(response));
        this.ws.once('close', (...args) => this.close(...args));
        this.ws.on('error', error => this.error(error));
        this.ws.on('message', data => this.wrap('message', data));
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

        if (this.ws)
            this.ws.close(code, reason);
        else
            this.clean();
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
    public async leaveChannel(guildId: string): Promise<void> {
        const player = this.players.get(guildId);
        if (!player) return;
        return await player.connection.disconnect();
    }

    /**
     * Handle connection open event from Lavalink
     * @param response Response from Lavalink
     * @internal
     */
    private open(response: IncomingMessage): void {
        const resumed = response.headers['session-resumed'] === 'true';
        this.emit('debug', `[Socket] <-> [${this.name}] : Connection Handshake Done! ${this.url} | Upgrade Headers Resuned: ${resumed}`);
        this.reconnects = 0;
        this.state = State.NEARLY;
    }

    /**
     * Handle message from Lavalink
     * @param message JSON message
     * @internal
     */
    private async message(message: unknown): Promise<void> {
        if (this.destroyed) return;
        const json = JSON.parse(message as string);
        if (!json) return;
        this.emit('raw', json);
        switch(json.op) {
            case OPCodes.STATS:
                this.emit('debug', `[Socket] <- [${this.name}] : Node Status Update | Server Load: ${this.penalties}`);
                this.stats = json;
                break;
            case OPCodes.READY:
                this.sessionId = json.sessionId;

                const resumeByLibrary = this.initialized && (this.players.size && this.manager.options.resumeByLibrary);
                if (!json.resumed && resumeByLibrary) {
                    try {
                        await this.resumeInternally();
                    } catch (error) {
                        this.error(error);
                    }
                }

                this.state = State.CONNECTED;
                this.emit('debug', `[Socket] -> [${this.name}] : Lavalink is ready! | Lavalink resume: ${json.resumed} | Lib resume: ${!!resumeByLibrary}`);
                this.emit('ready', json.resumed || resumeByLibrary);

                if (this.manager.options.resume && this.manager.options.resumeKey) {
                    await this.rest.updateSession(this.manager.options.resumeKey, this.manager.options.resumeTimeout);
                    this.emit('debug', `[Socket] -> [${this.name}] : Resuming configured!`);
                }
                break;
            case OPCodes.EVENT:
            case OPCodes.PLAYER_UPDATE:
                const player = this.players.get(json.guildId);
                if (!player) return;
                if (json.op === OPCodes.EVENT)
                    player.onPlayerEvent(json);
                else
                    player.onPlayerUpdate(json);
                break;
            default:
                this.emit('debug', `[Player] -> [Node] : Unknown Message OP ${json.op}`);
        }
    }

    /**
     * Handle closed event from lavalink
     * @param code Status close
     * @param reason Reason for connection close
     */
    private close(code: number, reason: unknown): void {
        this.emit('debug', `[Socket] <-/-> [${this.name}] : Connection Closed, Code: ${code || 'Unknown Code'}`);
        this.emit('close', code, reason);
        if (this.shouldClean)
            this.clean();
        else
            this.reconnect();
    }

    /**
     * To emit error events easily
     * @param error error message
     */
    public error(error: Error|unknown): void {
        this.emit('error', error);
    }

    /**
     * Destroys the websocket connection
     * @internal
     */
    private destroy(move: boolean, count: number = 0): void {
        this.ws?.removeAllListeners();
        this.ws?.close();
        this.ws = null;
        this.sessionId = null;
        this.state = State.DISCONNECTED;
        if (!this.shouldClean) return;
        this.destroyed = true;
        this.emit('disconnect', move, count);
    }

    /**
     * Cleans and moves players to other nodes if possible
     * @internal
     */
    private async clean(): Promise<void> {
        const move = this.manager.options.moveOnDisconnect && [ ...this.manager.nodes.values() ].filter(node => node.group === this.group).length > 1;
        if (!move) return this.destroy(false);
        const count = this.players.size;
        try {
            await this.movePlayers();
        } catch (error) {
            this.error(error);
        } finally {
            this.destroy(move, count);
        }
    }

    /**
     * Reconnect to Lavalink
     * @internal
     */
    private async reconnect(): Promise<void> {
        if (this.state === State.RECONNECTING) return;
        if (this.state !== State.DISCONNECTED) this.destroy(false);
        this.state = State.RECONNECTING;
        this.reconnects++;
        this.emit('reconnecting', this.manager.options.reconnectTries - this.reconnects, this.manager.options.reconnectInterval);
        this.emit('debug', `[Socket] -> [${this.name}] : Reconnecting in ${this.manager.options.reconnectInterval} seconds. ${this.manager.options.reconnectTries - this.reconnects} tries left`);
        await wait(this.manager.options.reconnectInterval * 1000);
        this.connect();
    }

    /**
     * Wraps the compatible function with an error handling
     * @internal
     */
    private wrap(name: 'message', ...args: [unknown]): void {
        this[name].apply(this, args)
            .catch(error => this.error(error));
    }

    /**
     * Tries to resume the players internally
     * @internal
     */
    private async resumeInternally(): Promise<void> {
        const playersWithData = [];
        const playersWithoutData = [];

        for (const player of this.players.values()) {
            if (player.connection.hasRequiredVoiceData)
                playersWithData.push(player);
            else
                playersWithoutData.push(player);
        }

        await Promise.all([
            ...playersWithData.map(player => player.resume()),
            ...playersWithoutData.map(player => player.connection.disconnect(false))
        ]);
    }

    /**
     * Tries to move the players to another node
     * @internal
     */
    private async movePlayers(): Promise<void> {
        const players = [ ...this.players.values() ];
        await Promise.all(players.map(player => player.moveToRecommendedNode()));
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
