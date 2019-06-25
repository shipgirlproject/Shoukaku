const { ShoukakuStatus } = require('./ShoukakuConstants.js');
class ShoukakuRouter {
    static ReconnectRouter(id) {
        for (const node of this.nodes.values()) {
            node.links.forEach((link) => {
                if (!link.voiceChannelID) return;
                if (link.state === ShoukakuStatus.CONNECTING) return;
                if (link.shardID !== id) return;
                link.connect({
                    guild_id: link.guildID,
                    channel_id: link.voiceChannelID,
                    self_deaf:  link.selfDeaf,
                    self_mute: link.selfMute
                }, (error) => {
                    if (error) {
                        link.player._listen('voiceClose', error);
                        return;
                    }
                    link.player._resume()
                        .catch(() => null);
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
        const link = this.links.get(packet.d.guild_id);
        if (!link) return;
        if (packet.t === 'VOICE_STATE_UPDATE') {
            if (!packet.d.channel_id) {
                if (link.state !== ShoukakuStatus.DISCONNECTED) link._voiceDisconnect();
                return;
            }
            link.build = packet.d;
        }
        if (packet.t === 'VOICE_SERVER_UPDATE') link.serverUpdate = packet;
    }

    static EventRouter(json) {
        const link = this.links.get(json.guildId);
        if (!link) return;
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
