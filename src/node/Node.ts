import { EventEmitter } from 'events';
import { IncomingMessage } from 'http';
import { NodeOption, Shoukaku } from '../Shoukaku';
import { Player } from '../guild/Player';
import { OpCodes, State, Versions } from '../Constants';
import { wait } from '../Utils';
import { Rest } from './Rest';
import Websocket from 'ws';

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

type NodeInfoVersion = {
    semver: string;
    major: number;
    minor: number;
    patch: number;
    preRelease?: string;
    build?: string;
};

type NodeInfoGit = {
    branch: string;
    commit: string;
    commitTime: number;
};

type NodeInfoPlugin = {
    name: string;
    version: string;
};

export type NodeInfo = {
    version: NodeInfoVersion;
    buildTime: number;
    git: NodeInfoGit;
    jvm: string;
    lavaplayer: string;
    sourceManagers: string[];
    filters: string[];
    plugins: NodeInfoPlugin[];
};

export interface ResumableHeaders {
    [key: string]: string;
    'Client-Name': string;
    'User-Agent': string;
    'Authorization': string;
    'User-Id': string;
    'Session-Id': string;
}

export interface NonResumableHeaders extends Omit<ResumableHeaders, 'Session-Id'> {}

/**
 * Represents a Lavalink node
 */
export class Node extends EventEmitter {
    /**
     * Shoukaku class
     */
    public readonly manager: Shoukaku;
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
     * Information about lavalink node
    */
    public info: NodeInfo|null;
    /**
     * Websocket instance
     */
    public ws: Websocket|null;
    /**
     * SessionId of this Lavalink connection (not to be confused with Discord SessionId)
     */
    public sessionId: string|null;
    /**
     * Boolean that represents if the node has initialized once
     */
    protected initialized: boolean;
    /**
     * Boolean that represents if this connection is destroyed
     */
    protected destroyed: boolean;
    /**
     * @param manager Shoukaku instance
     * @param options Options on creating this node
     * @param options.name Name of this node
     * @param options.url URL of Lavalink
     * @param options.auth Credentials to access Lavalnk
     * @param options.secure Whether to use secure protocols or not
     * @param options.group Group of this node
     */
    constructor(manager: Shoukaku, options: NodeOption) {
        super();
        this.manager = manager;
        this.rest = new (this.manager.options.structures.rest || Rest)(this, options);
        this.name = options.name;
        this.group = options.group;
        this.version = `/v${Versions.WEBSOCKET_VERSION}`;
        this.url = `${options.secure ? 'wss' : 'ws'}://${options.url}`;
        this.auth = options.auth;
        this.reconnects = 0;
        this.state = State.DISCONNECTED;
        this.stats = null;
        this.info = null;
        this.ws = null;
        this.sessionId = null;
        this.initialized = false;
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

        this.state = State.CONNECTING;

        const headers: NonResumableHeaders|ResumableHeaders = {
            'Client-Name': this.manager.options.userAgent,
            'User-Agent': this.manager.options.userAgent,
            'Authorization': this.auth,
            'User-Id': this.manager.id
        };

        if (this.sessionId) headers['Resume-Key'] = this.sessionId;
        this.emit('debug', `[Socket] -> [${this.name}] : Connecting ${this.url}, Version: ${this.version}, Trying to resume? ${!!this.sessionId}`);
        if (!this.initialized) this.initialized = true;

        const url = new URL(`${this.url}${this.version}/websocket`);
        this.ws = new Websocket(url.toString(), { headers } as Websocket.ClientOptions);
        this.ws.once('upgrade', response => this.open(response));
        this.ws.once('close', (...args) => this.close(...args));
        this.ws.on('error', error => this.error(error));
        this.ws.on('message', data => this.message(data).catch(error => this.error(error)));
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
     * Handle connection open event from Lavalink
     * @param response Response from Lavalink
     * @internal
     */
    private open(response: IncomingMessage): void {
        const resumed = response.headers['session-resumed'] === 'true';
        this.emit('debug', `[Socket] <-> [${this.name}] : Connection Handshake Done! ${this.url} | Upgrade Headers Resumed: ${resumed}`);
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
            case OpCodes.STATS:
                this.emit('debug', `[Socket] <- [${this.name}] : Node Status Update | Server Load: ${this.penalties}`);
                this.stats = json;
                break;
            case OpCodes.READY:
                this.sessionId = json.sessionId;
                const players = [ ...this.manager.players.values() ].filter(player => player.node.name === this.name);
                const resumeByLibrary = this.initialized && (players.length && this.manager.options.resumeByLibrary);
                if (!json.resumed && resumeByLibrary) {
                    try {
                        await this.resumePlayers();
                    } catch (error) {
                        this.error(error);
                    }
                }

                this.state = State.CONNECTED;
                this.emit('debug', `[Socket] -> [${this.name}] : Lavalink is ready! | Lavalink resume: ${json.resumed} | Lib resume: ${!!resumeByLibrary}`);
                this.emit('ready', json.resumed || resumeByLibrary);

                if (this.manager.options.resume) {
                    await this.rest.updateSession(this.manager.options.resume, this.manager.options.resumeTimeout);
                    this.emit('debug', `[Socket] -> [${this.name}] : Resuming configured!`);
                }
                break;
            case OpCodes.EVENT:
            case OpCodes.PLAYER_UPDATE:
                const player = this.manager.players.get(json.guildId);
                if (!player) return;
                if (json.op === OpCodes.EVENT)
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
    private destroy(count: number = 0): void {
        this.ws?.removeAllListeners();
        this.ws?.close();
        this.ws = null;
        this.sessionId = null;
        this.state = State.DISCONNECTED;
        if (!this.shouldClean) return;
        this.destroyed = true;
        this.emit('disconnect', count);
    }

    /**
     * Cleans and moves players to other nodes if possible
     * @internal
     */
    private async clean(): Promise<void> {
        const move = this.manager.options.moveOnDisconnect;
        if (!move) return this.destroy();
        let count = 0;
        try {
            count = await this.movePlayers();
        } catch (error) {
            this.error(error);
        } finally {
            this.destroy(count);
        }
    }

    /**
     * Reconnect to Lavalink
     * @internal
     */
    private async reconnect(): Promise<void> {
        if (this.state === State.RECONNECTING) return;
        if (this.state !== State.DISCONNECTED) this.destroy();
        this.state = State.RECONNECTING;
        this.reconnects++;
        this.emit('reconnecting', this.manager.options.reconnectTries - this.reconnects, this.manager.options.reconnectInterval);
        this.emit('debug', `[Socket] -> [${this.name}] : Reconnecting in ${this.manager.options.reconnectInterval} seconds. ${this.manager.options.reconnectTries - this.reconnects} tries left`);
        await wait(this.manager.options.reconnectInterval * 1000);
        this.connect();
    }

    /**
     * Tries to resume the players internally
     * @internal
     */
    private async resumePlayers(): Promise<void> {
        const playersWithData = [];
        const playersWithoutData = [];

        for (const player of this.manager.players.values()) {
            const serverUpdate = this.manager.connections.get(player.guildId)?.serverUpdate;
            if (serverUpdate)
                playersWithData.push(player);
            else
                playersWithoutData.push(player);
        }

        await Promise.allSettled([
            ...playersWithData.map(player => player.resumePlayer()),
            ...playersWithoutData.map(player => this.manager.leaveVoiceChannel(player.guildId))
        ]);
    }

    /**
     * Tries to move the players to another node
     * @internal
     */
    private async movePlayers(): Promise<number> {
        const players = [ ...this.manager.players.values() ];
        const data = await Promise.allSettled(players.map(player => player.movePlayer()));
        return data.filter(results => results.status === 'fulfilled').length;
    }
}
