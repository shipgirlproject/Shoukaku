export class ShoukakuStats {
    constructor(
        status: OPStats
    )

    public players: number;
    public playingPlayers: number;
    public memory: OPMemStats;
    public frameStats: OPFrameStats;
    public cpu: OPCPUStats;
    public uptime: number;
}

export interface OPStats {
    players: number;
    playingPlayers: number;
    memory: OPMemStats;
    frameStats: OPFrameStats;
    cpu: OPCPUStats;
    uptime: number;
}

export interface OPMemStats {
    reservable: number;
    used: number;
    free: number;
    allocated: number;
}

export interface OPFrameStats {
    sent: number;
    deficit: number;
    nulled: number;
}

export interface OPCPUStats {
    cores: number;
    systemLoad: number;
    lavalinkLoad: number;
}
