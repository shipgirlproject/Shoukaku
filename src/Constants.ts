import { NodeOption, ShoukakuOptions } from './Shoukaku';
import Info from '../package.json';

export enum State {
    CONNECTING,
    NEARLY,
    CONNECTED,
    DISCONNECTING,
    DISCONNECTED
}

export enum VoiceState {
    SESSION_READY,
    SESSION_ID_MISSING,
    SESSION_ENDPOINT_MISSING,
    SESSION_FAILED_UPDATE
}

export enum OPCodes {
    PLAYER_UPDATE = 'playerUpdate',
    STATS = 'stats',
    EVENT = 'event',
    READY = 'ready'
}

export enum Versions {
    REST_VERSION = 3,
    WEBSOCKET_VERSION = 3
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
