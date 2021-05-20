class ShoukakuNodeStatus {
    constructor(status = {}) {
        this.players = status.players || 0;
        this.playingPlayers = status.playingPlayers || 0;
        this.memory = status.memory || {
            reservable: 0,
            used: 0,
            free: 0,
            allocated: 0
        };
        this.frameStats = status.frameStats || {
            sent: 0,
            deficit: 0,
            nulled: 0
        };
        this.cpu = status.cpu || {
            cores: 0,
            systemLoad: 0,
            lavalinkLoad: 0
        };
        this.uptime = status.uptime || 0;
    }
}

module.exports = ShoukakuNodeStatus;