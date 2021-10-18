export enum state {
    CONNECTING = 0,
    CONNECTED = 1,
    DISCONNECTING = 2,
    DISCONNECTED = 3
}

export enum voiceState {
    SESSION_READY = 0,
    SESSION_ID_MISSING = 1,
    SESSION_ENDPOINT_MISSING = 2
}

export enum SearchTypes {
    soundcloud = 'scsearch',
    youtube = 'ytsearch',
    youtubemusic = 'ytmsearch'
}

export type LavalinkSource = "youtube" | "youtubemusic" | "soundcloud";
export type Snowflake = `${bigint}` | string;
export type Base64String = string;

export interface ShoukakuOptions {
    resumable?: boolean;
    resumableTimeout?: number;
    reconnectTries?: number;
    moveOnDisconnect?: boolean;
    restTimeout?: number;
    reconnectInterval?: number;
    userAgent?: string;
}

export interface NodeOptions {
    name: string;
    url: string;
    auth: string;
    secure?: boolean;
    group?: string;
}

export interface DecodedTrack {
    identifier?: string;
    isSeekable?: boolean;
    author?: string;
    length?: number;
    isStream?: boolean;
    position?: number;
    title?: string;
    uri?: string;
    sourceName?: string;
}
