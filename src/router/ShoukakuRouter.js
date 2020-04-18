const { ShoukakuStatus } = require('../constants/ShoukakuConstants.js');
/**
 * Router for certain events used & sent by Shoukaku
 * @class ShoukakuRouter
 */
class ShoukakuRouter {
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
                if (!packet.d.channel_id && ShoukakuStatus.CONNECTING !== player.voiceConnection.state) player.voiceConnection.state = ShoukakuStatus.DISCONNECTED;
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
                case 'TrackStartEvent':
                    player._listen('start', json);
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
