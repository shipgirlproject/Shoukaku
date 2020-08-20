declare module 'shoukaku' {
  import { EventEmitter } from "events";
  import { Client as DiscordClient, Base64String, Guild } from 'discord.js';

  export const version: string;

  export class ShoukakuError extends Error {
    constructor(message: string);
    public name: string;
  }

  export class ShoukakuTimeout extends Error {
    constructor(message: string);
    public name: string;
  }

  export class ShoukakuUtil {
    public static mergeDefault(def: Object, given: Object): Object;
    public static searchType(string: string): string;
    public static websocketSend(ws: WebSocket, payload: Object): Promise<void>;
  }

  export class ShoukakuTrackList {
    type: string;
    playlistName?: string;
    tracks: Array<ShoukakuTrack>;
  }

  export class ShoukakuTrack {
    track: string;
    info: {
      identifier?: string;
      isSeekable?: boolean;
      author?: string;
      length?: number;
      isStream?: boolean;
      position?: number;
      title?: string;
      uri?: string;
    };
  }

  export interface EqualizerBand {
    band: number;
    gain: number;
  }

  export type Source = 'youtube' | 'soundcloud';

  export enum ShoukakuStatus {
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    DISCONNECTING = 'DISCONNECTING',
    DISCONNECTED = 'DISCONNECTED',
  }

  export interface ShoukakuNodeStats {
    playingPlayers: number;
    op: 'stats';
    memory: {
      reservable: number;
      used: number;
      free: number;
      allocated: number;
    };
    frameStats: {
      sent: number;
      deficit: number;
      nulled: number;
    };
    players: number;
    cpu: {
      cores: number;
      systemLoad: number;
      lavalinkLoad: number;
    };
    uptime: number;
  }

  export interface ShoukakuJoinOptions {
    guildID: string;
    voiceChannelID: string;
    mute?: boolean;
    deaf?: boolean;
  }

  export interface ShoukakuPlayOptions {
    noReplace?: boolean,
    startTime?: boolean | number;
    endTime?: boolean | number;
  }

  export interface ShoukakuOptions {
    resumable?: boolean;
    resumableTimeout?: number;
    reconnectTries?: number;
    moveOnDisconnect?: boolean;
    restTimeout?: number;
  }

  export interface ShoukakuNodeOptions {
    name: string;
    host: string;
    port: number;
    auth: string;
  }

  class ShoukakuConstants {
    static ShoukakuStatus: ShoukakuStatus;
    static ShoukakuNodeStats: ShoukakuNodeStats;
    static ShoukakuJoinOptions: ShoukakuJoinOptions;
    static ShoukakuPlayOptions: ShoukakuPlayOptions;
    static ShoukakuOptions: ShoukakuOptions;
    static ShoukakuNodeOptions: ShoukakuNodeOptions;
    static ShoukakuNodes: Array<ShoukakuNodeOptions>;
  }

  export { ShoukakuConstants as Constants };

  export interface Reason {
    op: string;
    reason: string;
    code: number;
    byRemote: boolean;
    type: string;
    guildId: string;
  }

  export interface PlayerUpdate {
    op: "playerUpdate";
    guildId: string;
    state: {
      time: number;
      position: number;
    }
  }

  export class ShoukakuRest {
    constructor(host: string, port: string, auth: string, timeout: number);
    private auth: string;
    public timeout: number;
    public url: string;

    public resolve(identifier: string, search?: Source): Promise<ShoukakuTrackList | null>;
    public decode(track: Base64String): Promise<Object>;
    public getRoutePlannerStatus(): Promise<Object>;
    public unmarkFailedAddress(address: string): Promise<number>;
    public unmarkAllFailedAddress(): Promise<number>;

    private _getFetch(url: string): Promise<JSON>;
    private _postFetch(url: string, body: Object): Promise<number>;
  }

  export interface ShoukakuPlayer {
    on(event: 'end', listener: (reason: Reason) => void): this;
    on(event: 'error', listener: (err: ShoukakuError | Error) => void): this;
    on(event: 'nodeDisconnect', listener: (name: string) => void): this;
    on(event: 'resumed', listener: () => void): this;
    on(event: 'playerUpdate', listener: (data: PlayerUpdate) => void): this;
    on(event: 'closed' | 'trackException', listener: (data: unknown) => void): this;
    on(event: 'start', listener: (data: unknown) => void): this;
    once(event: 'end', listener: (reason: Reason) => void): this;
    once(event: 'error', listener: (err: ShoukakuError | Error) => void): this;
    once(event: 'nodeDisconnect', listener: (name: string) => void): this;
    once(event: 'resumed', listener: () => void): this;
    once(event: 'playerUpdate', listener: (data: PlayerUpdate) => void): this;
    once(event: 'closed' | 'trackException', listener: (data: unknown) => void): this;
    once(event: 'start', listener: (data: unknown) => void): this;
    off(event: 'end', listener: (reason: Reason) => void): this;
    off(event: 'error', listener: (err: ShoukakuError | Error) => void): this;
    off(event: 'nodeDisconnect', listener: (name: string) => void): this;
    off(event: 'resumed', listener: () => void): this;
    off(event: 'playerUpdate', listener: (data: PlayerUpdate) => void): this;
    off(event: 'closed' | 'trackException', listener: (data: unknown) => void): this;
    off(event: 'start', listener: (data: unknown) => void): this;
  }

  export class ShoukakuPlayer extends EventEmitter {
    constructor(node: ShoukakuSocket, guild: Guild);
    public voiceConnection: ShoukakuLink;
    public track: string | null;
    public paused: boolean;
    public volume: number;
    public bands: EqualizerBand[];
    public position: number;

    private connect(options: unknown, callback:(error: ShoukakuError | Error | null, player: ShoukakuPlayer) => void): void;

    public disconnect(): void;
    public moveToNode(name: string): Promise<void>;

    public playTrack(track: string | ShoukakuTrack, options?: ShoukakuPlayOptions): Promise<boolean>;
    public stopTrack(): Promise<boolean>;
    public setPaused(pause?: boolean): Promise<boolean>;
    public setEqualizer(bands: EqualizerBand[]): Promise<boolean>;
    public setVolume(volume: number): Promise<boolean>;
    public seekTo(position: number): Promise<boolean>;

    private reset(cleanBand: boolean): void;
    private resume(): Promise<void>;
  }

  export class ShoukakuLink {
    constructor(node: ShoukakuSocket, player: ShoukakuPlayer, guild: Guild);
    public node: ShoukakuSocket;
    public player: ShoukakuPlayer;

    public guildID: string;
    public shardID: number;
    public userID: string;
    public sessionID: string | null;
    public voiceChannelID: string | null;
    public selfMute: boolean;
    public selfDeaf: boolean;
    public state: ShoukakuStatus;

    private lastServerUpdate: unknown | null;
    private _callback: (err: ShoukakuError | Error | null, player: ShoukakuPlayer) => void | null;
    private _timeout: number | null;

    private stateUpdate(data: unknown);
    private serverUpdate(data: unknown);

    public attemptReconnect(): Promise<ShoukakuPlayer>;

    private connect(d: unknown, callback: (err: ShoukakuError | Error | null, player: ShoukakuPlayer) => void);
    private disconnect(): void;
    private move(): Promise<void>;
    private send(d: unknown): void;
  }

  export class ShoukakuSocket {
    constructor(shoukaku: Shoukaku, node: ShoukakuOptions);
    public shoukaku: Shoukaku;
    public players: Map<string, ShoukakuPlayer>;
    public rest: ShoukakuRest;
    public state: ShoukakuStatus;
    public stats: ShoukakuNodeStats;
    public reconnectAttempts: number;
    public name: string;
    public url: string;
    private auth: string;
    private resumed: boolean;
    private cleaner: boolean;
    private packetRouter: unknown;
    private eventRouter: unknown;

    private resumable: boolean;
    private resumableTimeout: number;
    public penalties: number;
    public connect(id: string, shardCount: number, resumable: boolean | string): void;
    public joinVoiceChannel(options: ShoukakuJoinOptions): Promise<ShoukakuPlayer>;
    public leaveVoiceChannel(guildID: string): void;

    private send(data: unknown): Promise<boolean>;
    private configureResuming(): Promise<boolean>;
    private executeCleaner(): Promise<void>;
    
    private _upgrade(response: unknown): void;
    private _open(): void;
    private _message(message: string): void;
    private _error(error: Error): void;
    private _close(code: number, reason: string): void;
  }

  export interface Shoukaku {
    on(event: 'debug', listener: (name: string, data: unknown) => void): this;
    on(event: 'error', listener: (name: string, error: ShoukakuError | Error) => void): this;
    on(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
    on(event: 'close', listener: (name: string, code: number, reason: string | null) => void): this;
    on(event: 'disconnected', listener: (name: string, reason: string | null) => void): this;
    once(event: 'debug', listener: (name: string, data: unknown) => void): this;
    once(event: 'error', listener: (name: string, error: ShoukakuError | Error) => void): this;
    once(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
    once(event: 'close', listener: (name: string, code: number, reason: string | null) => void): this;
    once(event: 'disconnected', listener: (name: string, reason: string | null) => void): this;
    off(event: 'debug', listener: (name: string, data: unknown) => void): this;
    off(event: 'error', listener: (name: string, error: ShoukakuError | Error) => void): this;
    off(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
    off(event: 'close', listener: (name: string, code: number, reason: string | null) => void): this;
    off(event: 'disconnected', listener: (name: string, reason: string | null) => void): this;
  }

  export class Shoukaku extends EventEmitter {
    constructor(client: DiscordClient, nodes: ShoukakuNodeOptions[], options: ShoukakuOptions);
    public client: DiscordClient;
    public id: string | null;
    public shardCount: number | null;
    public nodes: Map<string, ShoukakuSocket>;

    public players: Map<string, ShoukakuPlayer>;
    public totalPlayers: number;

    private options: ShoukakuOptions;
    private rawRouter: unknown;

    public addNode(nodeOptions: ShoukakuNodeOptions): void;
    public removeNode(name: string, reason?: string): void;
    public getNode(name?: string): ShoukakuSocket;
    public getPlayer(guildId: string): ShoukakuPlayer | null;

    private _ready(name: string, resumed: boolean): void;
    private _close(name: string, code: number, reason: string): void;
  }
}
