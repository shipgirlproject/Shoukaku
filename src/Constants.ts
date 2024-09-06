import Info from "../package.json";
import type { NodeOption, ShoukakuOptions } from "./Shoukaku";

export enum State {
    CONNECTING = 0,
    NEARLY = 1,
    CONNECTED = 2,
    RECONNECTING = 3,
    DISCONNECTING = 4,
    DISCONNECTED = 5,
}

export enum VoiceState {
    SESSION_READY = 0,
    SESSION_ID_MISSING = 1,
    SESSION_ENDPOINT_MISSING = 2,
    SESSION_FAILED_UPDATE = 3,
}

export enum OpCodes {
    PLAYER_UPDATE = "playerUpdate",
    STATS = "stats",
    EVENT = "event",
    READY = "ready",
}

export const Versions = {
    REST_VERSION: 4,
    WEBSOCKET_VERSION: 4,
};

export const ShoukakuDefaults: Required<ShoukakuOptions> = {
    resume: false,
    resumeTimeout: 30,
    resumeByLibrary: false,
    reconnectTries: 3,
    reconnectInterval: 5,
    restTimeout: 60,
    moveOnDisconnect: false,
    userAgent: "Discord Bot/unknown (https://github.com/shipgirlproject/Shoukaku.git)",
    structures: {},
    voiceConnectionTimeout: 15,
    nodeResolver: (nodes) =>
        [...nodes.values()]
            .filter((node) => node.state === State.CONNECTED)
            .sort((a, b) => a.penalties - b.penalties)
            .shift(),
};

export const ShoukakuClientInfo = `${Info.name}/${Info.version} (${Info.repository.url})`;

export const NodeDefaults: NodeOption = {
    name: "Default",
    url: "",
    auth: "",
    secure: false,
    group: undefined,
};
