class ShoukakuConstants {
    static get SHOUKAKU_STATUS() {
        return {
            CONNECTING: 'CONNECTING',
            CONNECTED: 'CONNECTED',
            DISCONNECTED: 'DISCONNECTED'
        };
    }

    static get SHOUKAKU_NODE_STATS() {
        return { 
            playingPlayers: 0,
            op: 'stats',
            memory: { 
                reservable: 0,
                used: 0,
                free: 0,
                allocated: 0
            },
            frameStats: { 
                sent: 0, 
                deficit: 0, 
                nulled: 0 
            },
            players: 0,
            cpu: { 
                cores: 0,
                systemLoad: 0,
                lavalinkLoad: 0 
            },
            uptime: 0
        };
    }

    static get ShoukakuOptions() {
        return {
            resumable: false,
            resumableTimeout: 30,
            reconnectInterval: 10000,
            reconnectTries: 2,
            restTimeout: 10000,
            handleNodeDisconnects: true
        };
    }

    static get ShoukakuNodeOptions() {
        return {
            name: null,
            host: null,
            port: null,
            auth: null
        };
    }

    static get ShoukakuBuildOptions() {
        return {    
            id: null,
            shardCount: 1
        };
    }
}

module.exports = ShoukakuConstants;