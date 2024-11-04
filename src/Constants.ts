import * as z from 'zod';
import Info from '../package.json';
// eslint-disable-next-line import-x/no-cycle
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

// export to allow compiler to determine shape
/**
 * Websocket operation codes
 * @see https://lavalink.dev/api/websocket#op-types
 */
export enum OpCodesEnum {
	PLAYER_UPDATE = 'playerUpdate',
	STATS = 'stats',
	EVENT = 'event',
	READY = 'ready'
}

export const OpCodes = z.nativeEnum(OpCodesEnum);
export type OpCode = z.TypeOf<typeof OpCodes>;

export const Versions = {
	REST_VERSION: 4,
	WEBSOCKET_VERSION: 4
};

export const ShoukakuDefaults: Required<ShoukakuOptions> = {
	validate: false,
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
