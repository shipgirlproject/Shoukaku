declare module 'shoukaku' {
  import { EventEmitter } from "events";
  import { Client as DiscordClient, Base64String, Guild } from 'discord.js';

  export const version: string;

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
    mute: boolean;
    deaf: boolean;
  }

  export interface ShoukakuPlayOptions {
    startTime: boolean | number;
    endTime: boolean | number;
  }

  export interface ShoukakuOptions {
    resumable: boolean;
    resumableTimeout: number;
    reconnectTries: number;
    restTimeout: number;
  }

  export interface ShoukakuNodeOptions {
    name: string;
    host: string;
    port: number;
    auth: string;
  }

  export interface ShoukakuBuildOptions {
    id: string;
    shardCount?: number;
  }

  class ShoukakuConstants {
    static ShoukakuStatus: ShoukakuStatus;
    static ShoukakuNodeStats: ShoukakuNodeStats;
    static ShoukakuJoinOptions: ShoukakuJoinOptions;
    static ShoukakuPlayOptions: ShoukakuPlayOptions;
    static ShoukakuOptions: ShoukakuOptions;
    static ShoukakuNodeOptions: ShoukakuNodeOptions;
    static ShoukakuBuildOptions: ShoukakuBuildOptions;
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

  export class ShoukakuResolver {
    constructor(host: string, port: string, auth: string, timeout: number);
    public timeout: number;
    public auth: string;
    public url: string;
    public resolve(identifier: string, search: string): Promise<any>;
    public decode(track: Base64String): Promise<any>;

    private _fetch(url: string): Promise<any>;
  }

  export interface ShoukakuPlayer {
    on(event: 'end' | 'exception' | 'stuck', listener: (reason: Reason) => void): this;
    on(event: 'voiceClose', listener: (reason: Reason | Error) => void): this;
    on(event: 'resumed', listener: () => void): this;
    on(event: 'nodeDisconnect', listener: (name: string) => void): this;
    on(event: 'playerUpdate', listener: (data: Reason) => void): this;
    once(event: 'end' | 'exception' | 'stuck', listener: (reason: Reason) => void): this;
    once(event: 'voiceClose', listener: (reason: Error | Reason) => void): this;
    once(event: 'resumed', listener: () => void): this;
    once(event: 'nodeDisconnect', listener: (name: string) => void): this;
    once(event: 'playerUpdate', listener: (data: Reason) => void): this;
    off(event: 'end' | 'exception' | 'stuck', listener: (reason: Reason) => void): this;
    off(event: 'voiceClose', listener: (reason: Error | Reason) => void): this;
    off(event: 'resumed', listener: () => void): this;
    off(event: 'nodeDisconnect', listener: (name: string) => void): this;
    off(event: 'playerUpdate', listener: (data: Reason) => void): this;
  }

  export class ShoukakuPlayer {
    constructor(link: ShoukakuLink);
    public link: ShoukakuLink;
    public track: string | null;
    public paused: boolean;
    public volume: number;
    public bands: number[];
    public position: number;

    public playTrack(track: string, options: ShoukakuPlayOptions): Promise<boolean>;
    public stopTrack(): Promise<boolean>;
    public setPaused(pause?: boolean): Promise<boolean>;
    public setEqualizer(bands: number[]): Promise<boolean>;
    public setVolume(volume: number): Promise<boolean>;
    public seekTo(position: number): Promise<boolean>;

    private _listen(event: string, data: any): void;
    private _clearTrack(): void;
    private _clearPlayer(): void;
    private _resume(): Promise<void>;
  }

  export class ShoukakuLink {
    constructor(node: ShoukakuSocket, guild: Guild);
    public node: ShoukakuSocket;
    public guildID: string;
    public shardID: number;
    public userID: string;
    public sessionID: string | null;
    public voiceChannelID: string | null;
    public selfMute: boolean;
    public selfDeaf: boolean;
    public state: ShoukakuStatus;
    public player: ShoukakuPlayer;

    public connect(options: any, callback: (error: Error, link: ShoukakuLink) => void): void;
    public disconnect(): void;

    private _queueConnection(d: any): void;
    private _removeConnect(guild_id: string): void;
    private _clearVoice(): void;
    private _destroy(): void;
    private _voiceUpdate(event: any): void;
    private _voiceDisconnect(): void;
    private _nodeDisconnected(): void;
  }

  export class ShoukakuSocket {
    constructor(shoukaku: Shoukaku, node: ShoukakuOptions);
    public shoukaku: Shoukaku;
    public links: Map<string, ShoukakuLink>;
    public rest: ShoukakuResolver;
    public state: ShoukakuStatus;
    public stats: ShoukakuNodeStats;
    public reconnectAttempts: number;
    public name: string;
    public url: string;
    public auth: string;
    public resumed: boolean;
    public cleaner: boolean;

    public resumable: boolean;
    public resumableTimeout: number;
    public penalties: number;
    public connect(id: string, shardCount: number, resumable: boolean | string): void;
    public joinVoiceChannel(options: ShoukakuJoinOptions): Promise<ShoukakuLink>;

    private send(data: any): void;
    private _configureResuming(): void;
    private _configureCleaner(state: boolean): void;
    private _executeCleaner(): void;
    private _upgrade(response: any): void;
    private _open(): void;
    private _message(message: string): void;
    private _error(error: Error): void;
    private _close(code: number, reason: string): void;
  }

  export interface Shoukaku {
    on(event: 'debug', listener: (name: string, data: any) => void): this;
    on(event: 'error', listener: (name: string, error: Error) => void): this;
    on(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
    on(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    on(event: 'disconnected', listener: (name: string, reason: string) => void): this;
    once(event: 'debug', listener: (name: string, data: any) => void): this;
    once(event: 'error', listener: (name: string, error: Error) => void): this;
    once(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
    once(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    once(event: 'disconnected', listener: (name: string, reason: string) => void): this;
    off(event: 'debug', listener: (name: string, data: any) => void): this;
    off(event: 'error', listener: (name: string, error: Error) => void): this;
    off(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
    off(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    off(event: 'disconnected', listener: (name: string, reason: string) => void): this;
  }

  export class Shoukaku {
    constructor(client: DiscordClient, options: ShoukakuOptions);
    public client: DiscordClient;
    public id: string | null;
    public shardCount: number | null;
    public nodes: Map<string, ShoukakuSocket>;

    public links: Map<string, ShoukakuLink>;
    public totalLinks: number;

    public options: ShoukakuOptions;
    public init: boolean;

    public build(nodes: ShoukakuNodeOptions[], options: ShoukakuBuildOptions): void;
    public addNode(nodeOptions: ShoukakuNodeOptions): void;
    public removeNode(name: string, libraryInvoked?: boolean): void;
    public getNode(name?: boolean | string): ShoukakuSocket;
    public getLink(guildId: string): ShoukakuLink | null;

    private send(payload: any): void;
    private _ready(name: string, resumed: boolean): void;
    private _reconnect(name: string, code: number, reason: string): void;
    private _mergeDefault<T, J>(def: T, given: J): T & J;
  }
}
