const { SHOUKAKU_STATUS } = require('./ShoukakuConstants.js');
class ShoukakuRouter {
    static ReconnectRouter() {
        for (const node of this.nodes.values()) {
            for (const link of node.links.values()) {
                if (!link.voiceChannelID) continue;
                if (link.state === SHOUKAKU_STATUS.CONNECTING) continue;
                link.connect({
                    guild_id: link.guildID,
                    channel_id: link.voiceChannelID,
                    self_deaf:  link.selfDeaf,
                    self_mute: link.selfMute
                }, (error) => {
                    if (error) link.player.emit('voiceClose', error);
                });
            }
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
        if (json.op  === 'playerUpdate') return link.player._listen('playerUpdate', json.state);
        if (json.op === 'event') {
            if (json.type === 'TrackEndEvent') return link.player._listen('end', json);
            if (json.type === 'TrackExceptionEvent') return link.player._listen('exception', json);
            if (json.type === 'TrackStuckEvent') return link.player._listen('stuck', json);
            if (json.type === 'WebSocketClosedEvent') return link.player._listen('voiceClose', json);
        }
    }
}
module.exports = ShoukakuRouter;
