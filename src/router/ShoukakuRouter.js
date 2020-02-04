const { ShoukakuStatus } = require('../constants/ShoukakuConstants.js');
const ShoukakuError = require('../constants/ShoukakuError.js');

class ShoukakuRouter {
    static async ReconnectRouter(id) {
        if (this.processingReconnect.has(id)) return;
        this.processingReconnect.add(id);
        for (const node of this.nodes.values()) {
            for (const player of node.players.values()) {
                const { voiceConnection } = player;
                if (!voiceConnection.voiceChannelID) continue;
                if (voiceConnection.state === ShoukakuStatus.CONNECTING) continue;
                if (voiceConnection.shardID !== id) continue;
                const connectPromise = new Promise((resolve, reject) => {
                    player.connect({
                        guild_id: voiceConnection.guildID,
                        channel_id: voiceConnection.voiceChannelID,
                        self_deaf:  voiceConnection.selfDeaf,
                        self_mute: voiceConnection.selfMute
                    }, (error) => {
                        if (error) return reject(error);
                        player._resume()
                            .then(() => resolve())
                            .catch((error) => reject(error));
                    });
                });
                try {
                    await connectPromise();
                } catch (error) {
                    player._listen('error', error);
                }
            }
        }
        this.processingReconnect.delete(id);
    }

    static RawRouter(packet) {
        if (packet.t === 'VOICE_STATE_UPDATE') {
            if (packet.d.user_id !== this.id) return;
            this.emit('packetUpdate', packet);
        }
        if (packet.t === 'VOICE_SERVER_UPDATE') this.emit('packetUpdate', packet);
    }

    static PacketRouter(packet) {
        const player = this.players.get(packet.d.guild_id);
        if (!player) return;
        switch (packet.t) {
            case 'VOICE_STATE_UPDATE':
                player.voiceConnection.stateUpdate(packet.d);
                if (!packet.d.channel_id) player._listen('error', new ShoukakuError('Voice connection is closed unexpectedly.'));
                break;
            case 'VOICE_SERVER_UPDATE':
                player.voiceConnection.serverUpdate(packet.d);
        }
    }

    static EventRouter(json) {
        const player = this.players.get(json.guildId);
        if (!player) return;
        if (json.op === 'playerUpdate') {
            player._listen('playerUpdate', json.state);
            return;
        }
        if (json.op === 'event') {
            switch (json.type) {
                case 'TrackEndEvent':
                    player._listen('end', json);
                    break;
                case 'TrackStuckEvent':
                    player._listen('end', json);
                    break;
                case 'TrackExceptionEvent':
                    player._listen('trackException', json);
                    break;
                case 'WebSocketClosedEvent':
                    player._listen('closed', json);
                    break;
            }
        }
    }
}
module.exports = ShoukakuRouter;
