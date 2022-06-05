import { NodeOption, ShoukakuOptions } from './Shoukaku';
import Info from '../package.json';

export enum State {
    CONNECTING,
    CONNECTED,
    DISCONNECTING,
    DISCONNECTED
}

export enum VoiceState {
    SESSION_READY,
    SESSION_ID_MISSING,
    SESSION_ENDPOINT_MISSING
}

export enum OPCodes {
    // From Lavalink
    VOICE_UPDATE = 'voiceUpdate',
    PLAY = 'play',
    STOP = 'stop',
    PAUSE = 'pause',
    SEEK = 'seek',
    VOLUME = 'volume',
    FILTERS = 'filters',
    DESTROY = 'destroy',
    // To Lavalink
    PLAYER_UPDATE = 'playerUpdate',
    CONFIGURE_RESUMING = 'configureResuming',
    STATS = 'stats',
    EVENT = 'event'
}

export const ShoukakuDefaults: ShoukakuOptions = {
    resume: false,
    resumeKey: `Shoukaku@${Info.version}(${Info.repository.url})`,
    resumeTimeout: 30000,
    resumeByLibrary: false,
    alwaysSendResumeKey: false,
    reconnectTries: 3,
    reconnectInterval: 5000,
    restTimeout: 60000,
    moveOnDisconnect: false,
    userAgent: `${Info.name}bot/${Info.version} (${Info.repository.url})`,
    structures: {}
};

export const NodeDefaults: NodeOption = {
    name: 'Default',
    url: '',
    auth: '',
    secure: false,
    group: undefined
};
