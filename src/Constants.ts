import { readFileSync } from 'fs';
import { NodeOption, ShoukakuOptions } from './Shoukaku';

interface PackagePartial {
    name: string,
    version: string,
    repository: { url: string }
}

const info: PackagePartial = JSON.parse(readFileSync('./package.json').toString());

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


export const ShoukakuDefaults: ShoukakuOptions = {
    resume: false,
    resumeKey: 'Aircraft_Carrier',
    resumeTimeout: 30000,
    reconnectTries: 3,
    reconnectInterval: 5000,
    restTimeout: 60000,
    moveOnDisconnect: false,
    userAgent: `${info.name}/${info.version}(${info.repository.url})`
}

export const NodeDefaults: NodeOption = {
    name: 'Default',
    url: '',
    auth: '',
    secure: false,
    group: undefined
}