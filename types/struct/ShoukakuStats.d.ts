import { OPCPUStats, OPFrameStats, OPMemStats, OPStats } from '..';

export class ShoukakuStats {
    constructor(status: OPStats);

    public players: number;
    public playingPlayers: number;
    public memory: OPMemStats;
    public frameStats: OPFrameStats;
    public cpu: OPCPUStats;
    public uptime: number;
}
