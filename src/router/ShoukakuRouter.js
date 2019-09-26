const { ShoukakuStatus } = require('../constants/ShoukakuConstants.js');
const ShoukakuError = require('../constants/ShoukakuError.js');

class ShoukakuRouter {
    static ReconnectRouter(id) {
        for (const node of this.nodes.values()) {
            node.players.forEach((player) => {
                const { voiceConnection } = player;
                if (!voiceConnection.voiceChannelID) return;
                if (voiceConnection.state === ShoukakuStatus.CONNECTING) return;
                if (voiceConnection.shardID !== id) return;
                player.connect({
                    guild_id: voiceConnection.guildID,
                    channel_id: voiceConnection.voiceChannelID,
                    self_deaf:  voiceConnection.selfDeaf,
                    self_mute: voiceConnection.selfMute
                }, (error) => {
                    if (!error)
                        return player._resume()
                            .catch((error) => player._listen('error', new ShoukakuError(error.message)));
                    player._listen('error', error);
                });
            });
        }
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
                player.voiceConnection.build = packet.d;
                if (!packet.d.channel_id) player._listen('error', new ShoukakuError('Voice connection is closed unexpectedly.'));
                break;
            case 'VOICE_SERVER_UPDATE':
                player.voiceConnection.serverUpdate = packet.d;
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
