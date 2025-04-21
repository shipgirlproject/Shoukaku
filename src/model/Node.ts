export enum LavalinkOpCodes {
	Ready = 'ready',
	PlayerUpdate = 'playerUpdate',
	Stats = 'stats',
	Event = 'event'
}

export interface Ready {
	op: LavalinkOpCodes.Ready;
	resumed: boolean;
	sessionId: string;
}

export interface NodeMemory {
	reservable: number;
	used: number;
	free: number;
	allocated: number;
}

export interface NodeFrameStats {
	sent: number;
	deficit: number;
	nulled: number;
}

export interface NodeCpu {
	cores: number;
	systemLoad: number;
	lavalinkLoad: number;
}

export interface Stats {
	op: LavalinkOpCodes.Stats;
	players: number;
	playingPlayers: number;
	memory: NodeMemory;
	frameStats: NodeFrameStats | null;
	cpu: NodeCpu;
	uptime: number;
}

export interface NodeInfoVersion {
	semver: string;
	major: number;
	minor: number;
	patch: number;
	preRelease?: string;
	build?: string;
}

export interface NodeInfoGit {
	branch: string;
	commit: string;
	commitTime: number;
}

export interface NodeInfoPlugin {
	name: string;
	version: string;
}

export interface NodeInfo {
	version: NodeInfoVersion;
	buildTime: number;
	git: NodeInfoGit;
	jvm: string;
	lavaplayer: string;
	sourceManagers: string[];
	filters: string[];
	plugins: NodeInfoPlugin[];
}
