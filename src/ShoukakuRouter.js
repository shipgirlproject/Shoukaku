const { SHOUKAKU_STATUS } = require('./ShoukakuConstants.js');
class ShoukakuRouter {
    static PacketRouter(packet) {
        const link = this.links.get(packet.d.guild_id);
        if (!link) return;
        if (packet.t === 'VOICE_STATE_UPDATE') {
            if (!packet.d.channel_id) {
                if (link.state !== SHOUKAKU_STATUS.DISCONNECTED) link._voiceDisconnect();
                return;
            }
            link.build = packet.d;
        }
        if (packet.t === 'VOICE_SERVER_UPDATE') link.serverUpdate = packet;
    }
    
    static EventRouter(json) {
        const link = this.links.get(json.guildId);
        if (!link) return false;
        if (json.op  === 'playerUpdate') return link.player._playerUpdate(json.state);
        if (json.op === 'event') {
            if (json.type === 'TrackEndEvent') return link.player.emit('TrackEnd');
            if (json.type === 'TrackExceptionEvent') return link.player.emit('TrackException');
            if (json.type === 'TrackStuckEvent') return link.player.emit('TrackStuck');
            if (json.type === 'WebSocketClosedEvent') return link.player.emit('WebSocketClosed');
        }
    }
}
module.exports = ShoukakuRouter;