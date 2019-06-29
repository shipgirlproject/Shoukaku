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
    shardCount: number;
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

  interface ShoukakuResolver {
    constructor(host: string, port: string, auth: string, timeout: number): void;
    timeout: number;
    auth: string;
    url: string;
    resolve(identifier: string, search: string): Promise<any>;
    decode(track: Base64String): Promise<any>;
  }

  interface ShoukakuPlayer {
    constructor(link: ShoukakuLink): void;
    link: ShoukakuLink;
    track: string | null;
    paused: boolean;
    volume: number;
    bands: number[];
    position: number;

    playTrack(track: string, options: ShoukakuPlayOptions): Promise<boolean>;
    stopTrack(): Promise<boolean>;
    setPaused(pause?: boolean): Promise<boolean>;
    setEqualizer(bands: number[]): Promise<boolean>;
    setVolume(volume: number): Promise<boolean>;
    seekTo(position: number): Promise<boolean>;

    on(event: 'end' | 'exception' | 'stuck' | 'voiceClose', listener: (reason: any) => void): this;
    on(event: 'resumed', listener: () => void): this;
    on(event: 'nodeDisconnect', listener: (name: string) => void): this;
    on(event: 'playerUpdate', listener: (data: any) => void): this;
    once(event: 'end' | 'exception' | 'stuck' | 'voiceClose', listener: (reason: any) => void): this;
    once(event: 'resumed', listener: () => void): this;
    once(event: 'nodeDisconnect', listener: (name: string) => void): this;
    once(event: 'playerUpdate', listener: (data: any) => void): this;
    off(event: 'end' | 'exception' | 'stuck' | 'voiceClose', listener: (reason: any) => void): this;
    off(event: 'resumed', listener: () => void): this;
    off(event: 'nodeDisconnect', listener: (name: string) => void): this;
    off(event: 'playerUpdate', listener: (data: any) => void): this;
  }

  interface ShoukakuLink {
    constructor(node: ShoukakuSocket, guild: Guild): void;
    node: ShoukakuSocket;
    guildID: string;
    shardID: number;
    userID: string;
    sessionID: string | null;
    voiceChannelID: string | null;
    selfMute: boolean;
    selfDeaf: boolean;
    state: ShoukakuStatus;
    player: ShoukakuPlayer;
  }

  interface ShoukakuSocket {
    constructor(shoukaku: Shoukaku, node: ShoukakuOptions): void;
    shoukaku: Shoukaku;
    links: Map<string, ShoukakuLink>;
    rest: ShoukakuResolver;
    state: ShoukakuStatus;
    stats: ShoukakuNodeStats;
    reconnectAttempts: number;
    name: string;
    url: string;
    auth: string;
    resumed: boolean;
    cleaner: boolean;
    
    resumable: boolean;
    resumableTimeout: number;
    penalties: number;
    connect(id: string, shardCount: number, resumable: boolean | string): void;
    joinVoiceChannel(options: ShoukakuJoinOptions): Promise<ShoukakuLink>;

  }

  export interface Shoukaku {
    constructor(client: DiscordClient, options: ShoukakuOptions): void;
    client: DiscordClient;
    id: string | null;
    shardCount: number | null;
    nodes: Map<string, ShoukakuSocket>;

    links: Map<string, ShoukakuLink>;
    totalLinks: number;

    build(nodes: ShoukakuNodeOptions, options: ShoukakuBuildOptions): void;
    addNode(nodeOptions: ShoukakuNodeOptions): void;
    removeNode(name: string, libraryInvoked?: boolean): void;
    getNode(name?: boolean | string): ShoukakuSocket;
    getLink(guildId: string): ShoukakuLink | null;

    on(event: 'debug' | 'error' | 'read' | 'closed' | 'disconnected', listener: (name: string, data: any) => void): this;
    once(event: 'debug' | 'error' | 'read' | 'closed' | 'disconnected', listener: (name: string, data: any) => void): this;
    off(event: 'debug' | 'error' | 'read' | 'closed' | 'disconnected', listener: (name: string, data: any) => void): this;
  }
}
