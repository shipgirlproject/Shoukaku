import Info from '../package.json';
import { NodeOption, ShoukakuOptions } from './Shoukaku';

export enum State {
	CONNECTING,
	NEARLY,
	CONNECTED,
	RECONNECTING,
	DISCONNECTING,
	DISCONNECTED
}

export enum VoiceState {
	SESSION_READY,
	SESSION_ID_MISSING,
	SESSION_ENDPOINT_MISSING,
	SESSION_FAILED_UPDATE
}

export enum OpCodes {
	PLAYER_UPDATE = 'playerUpdate',
	STATS = 'stats',
	EVENT = 'event',
	READY = 'ready'
}

export const Versions = {
	REST_VERSION: 4,
	WEBSOCKET_VERSION: 4
};

export const ShoukakuDefaults: Required<ShoukakuOptions> = {
	resume: false,
	resumeTimeout: 30,
	resumeByLibrary: false,
	reconnectTries: 3,
	reconnectInterval: 5,
	restTimeout: 60,
	moveOnDisconnect: false,
	userAgent: 'Discord Bot/unknown (https://github.com/shipgirlproject/Shoukaku.git)',
	structures: {},
	voiceConnectionTimeout: 15,
	nodeResolver: (nodes) => [ ...nodes.values() ]
		.filter(node => node.state === State.CONNECTED)
		.sort((a, b) => a.penalties - b.penalties)
		.shift()
};

export const ShoukakuClientInfo = `${Info.name}/${Info.version} (${Info.repository.url})`;

export const NodeDefaults: NodeOption = {
	name: 'Default',
	url: '',
	auth: '',
	secure: false,
	group: undefined
};
