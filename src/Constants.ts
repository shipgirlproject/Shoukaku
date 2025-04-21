import Info from '../package.json';
import { ConnectionState } from './model/Library';
import type { NodeOption, OptionalOptions } from './Shoukaku';

export const Versions = {
	REST_VERSION: 4,
	WEBSOCKET_VERSION: 4
};

export const ShoukakuDefaults: Required<OptionalOptions> = {
	resume: false,
	resumeTimeout: 30,
	reconnectTries: 3,
	reconnectInterval: 5,
	restTimeout: 60,
	moveOnDisconnect: true,
	userAgent: 'Discord Bot/unknown (https://github.com/shipgirlproject/Shoukaku.git)',
	structures: {},
	voiceConnectionTimeout: 15,
	nodeResolver: (nodes) => [ ...nodes.values() ]
		.filter(node => node.state === ConnectionState.Connected)
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
