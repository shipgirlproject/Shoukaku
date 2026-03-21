import Info from '../package.json';
import type { NodeOption, ShoukakuOptions } from './Shoukaku';
import { State } from './Constants'; // Assuming State is exported here or adjust import as needed

export enum State {
	CONNECTING,
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
	nodeResolver: (nodes, connection) => {
		const connectedNodes = [ ...nodes.values() ].filter(node => node.state === State.CONNECTED);
		if (!connectedNodes.length) return undefined;

		// If the connection has a region, try to find nodes that match it
		if (connection?.region) {
			const regionalNodes = connectedNodes.filter(node => node.region === connection.region);
			if (regionalNodes.length) {
				// Sort matching regional nodes by penalty
				return regionalNodes.sort((a, b) => a.penalties - b.penalties).shift();
			}
		}

		// Fallback: Just return the node with the lowest penalty globally
		return connectedNodes.sort((a, b) => a.penalties - b.penalties).shift();
	}
};

export const ShoukakuClientInfo = `${Info.name}/${Info.version} (${Info.repository.url})`;

export const NodeDefaults: NodeOption = {
	name: 'Default',
	url: '',
	auth: '',
	secure: false,
	group: undefined,
	region: undefined
};
