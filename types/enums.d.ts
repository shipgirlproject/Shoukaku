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
    soundcloud = "scsearch",
    youtube = "ytsearch",
    youtubemusic = "ytmsearch"
}