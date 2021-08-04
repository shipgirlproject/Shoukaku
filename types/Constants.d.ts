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

export type Snowflake = string;
export type Base64String = string;

export interface ShoukakuOptions {
    resumable?: boolean;
    resumableTimeout?: number;
    reconnectTries?: number;
    moveOnDisconnect?: boolean;
    restTimeout?: number;
    reconnectInterval?: number;
    closeEventDelay?: number;
    userAgent?: string;
}

export interface NodeOptions {
    name: string;
    url: string;
    auth: string;
    secure?: boolean;
    group?: string;
}

export class ShoukakuTrackList {
    type: 'PLAYLIST' | 'TRACK' | 'SEARCH';
    playlistName?: string;
    selectedTrack: number;
    tracks: Array<ShoukakuTrack>;
}

export class ShoukakuTrack {
    track: Base64String;
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

export interface DecodedTrack {
  identifier: string;
  isSeekable: boolean;
  author: string;
  length: number;
  isStream: boolean;
  position: number;
  title: string;
  uri: string;
  sourceName: string;
}
