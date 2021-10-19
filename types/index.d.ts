export type TrackEndReason = "FINISHED" | "LOAD_FAILED" | "STOPPED" | "REPLACED" | "CLEANUP";
export type Severity = "COMMON" | "SUSPICIOUS" | "FAULT";
export type PlayerEventType = "TrackStartEvent" | "TrackEndEvent" | "TrackExceptionEvent" | "TrackStuckEvent" | "WebSocketClosedEvent";
export type LavalinkSource = "youtube" | "youtubemusic" | "soundcloud";
export type Snowflake = `${bigint}` | string;
export type Base64String = string;

// Shoukaku Connection
export interface ConnectOptions {
    guildId: Snowflake;
    shardId: number;
    channelId: Snowflake;
    deaf?: boolean;
    mute?: boolean;
}

export interface VoiceServerUpdate {
    token: string;
    guild_id: Snowflake;
    endpoint: string | null;
}

export interface VoiceStateUpdate {
    session_id: string;
    channel_id: Snowflake;
    self_deaf: boolean;
    self_mute: boolean;
}

// Libraries
export interface GetterObj {
    guilds: Map<any, any>;
    id: () => Snowflake;
    ws: (shardId: number, payload: string, important: boolean) => any;
}

// Shoukaku Player
export interface PlayerEvent {
    op: "event";
    type: PlayerEventType;
    guildId: Snowflake;
}

export interface Exception {
    severity: Severity;
    message: string;
    cause: string;
}

export interface TrackStartEvent extends PlayerEvent {
    type: "TrackStartEvent";
    track: Base64String;
}

export interface TrackEndEvent extends PlayerEvent {
    type: "TrackEndEvent";
    track: Base64String;
    reason: TrackEndReason;
}

export interface TrackExceptionEvent extends PlayerEvent {
    type: "TrackExceptionEvent";
    exception?: Exception;
    error: string;
}

export interface TrackStuckEvent extends PlayerEvent {
    type: "TrackStuckEvent";
    thresholdMs: number;
}

export interface WebSocketClosedEvent extends PlayerEvent {
    type: "WebSocketClosedEvent";
    code: number;
    byRemote: boolean;
    reason: string;
}

export interface PlayerUpdate {
    op: "playerUpdate";
    state: {
        position: number;
        time: number;
    };
    guildId: Snowflake;
}

// Shoukaku Rest
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

// Shoukaku Socket
export interface JoinOptions {
    guildId: Snowflake,
    shardId: number,
    channelId: Snowflake,
    mute?: boolean,
    deaf?: boolean
}

// Shoukaku Filter
export interface FilterSettings {
    volume: number;
    equalizer?: FilterEqSettings[];
    karaoke?: FilterKaraokeSettings;
    timescale?: FilterTimescaleSettings;
    tremolo?: FilterFreqSettings;
    vibrato?: FilterFreqSettings;
    rotation?: FilterRotationSettings;
    distortion?: FilterDistortionSettings;
    channelMix?: FilterChannelMixSettings;
    lowPass?: FilterLowPassSettings
}

export interface FilterChannelMixSettings {
    leftToLeft?: number;
    leftToRight?: number;
    rightToLeft?: number;
    rightToRight?: number;
}

export interface FilterLowPassSettings {
    smoothing?: number
}

export interface FilterEqSettings {
    band: number;
    gain: number;
}

export interface FilterKaraokeSettings {
    level?: number;
    monoLevel?: number;
    filterBand?: number;
    filterWidth?: number;
}

export interface FilterTimescaleSettings {
    speed?: number;
    pitch?: number;
    rate?: number;
}

export interface FilterFreqSettings {
    frequency?: number;
    depth?: number;
}

export interface FilterRotationSettings {
    rotationHz?: number;
}

export interface FilterDistortionSettings {
    sinOffset?: number;
    sinScale?: number;
    cosOffset?: number;
    cosScale?: number;
    tanOffset?: number;
    tanScale?: number;
    offset?: number;
    scale?: number;
}

// Shoukaku Stats
export interface OPStats {
    players: number;
    playingPlayers: number;
    memory: OPMemStats;
    frameStats: OPFrameStats;
    cpu: OPCPUStats;
    uptime: number;
}

export interface OPMemStats {
    reservable: number;
    used: number;
    free: number;
    allocated: number;
}

export interface OPFrameStats {
    sent: number;
    deficit: number;
    nulled: number;
}

export interface OPCPUStats {
    cores: number;
    systemLoad: number;
    lavalinkLoad: number;
}

// Shoukaku
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
