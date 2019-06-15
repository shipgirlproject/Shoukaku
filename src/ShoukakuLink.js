const { SHOUKAKU_STATUS } = require('./ShoukakuConstants.js');
const ShoukakuPlayer = require('./ShoukakuPlayer.js');

class ShoukakuLink {
    constructor(node) {

        this.node = node;
        this.lastServerUpdate = null;
        this.sessionID = null;
        this.userID = null;
        this.guildID = null;
        this.voiceChannelID = null;
        this.state = SHOUKAKU_STATUS.DISCONNECTED;
        this.player = new ShoukakuPlayer(this);
        Object.defineProperty(this, '_callback', { value: null, writable: true });
        Object.defineProperty(this, '_timeout', { value: null, writable: true });
    }
    
    set build(data) {
        this.userID = data.user_id;
        this.guildID = data.guild_id;
        this.voiceChannelID = data.channel_id;
        this.sessionID = data.session_id;
    }

    set serverUpdate(packet) {
        this.lastServerUpdate = packet.d;
        this._voiceUpdate(packet.d);
    }

    connect(options, callback) {
        this._callback = callback;
        this.node.shoukaku.send({
            op: 4,
            d: options
        });
        this.state = SHOUKAKU_STATUS.CONNECTING;
    }

    disconnect() {
        this.state = SHOUKAKU_STATUS.DISCONNECTING;
        this.lastServerUpdate = null;
        this.player._clearTrack();
        this.player.removeAllListeners();
        if (!this.node.shoukaku.client.guilds.has(this.guildID)) return this._voiceDisconnect();
        this.node.shoukaku.send({
            op: 4,
            d: {
                guild_id: this.guildID,
                channel_id: null,
                self_mute: false,
                self_deaf: false
            }
        });
        this._timeout = setTimeout(() => this._voiceDisconnect(), 15000);
    }
    
    send(data) {
        return this.node.send(data);
    }

    _voiceDisconnect() {
        this.state = SHOUKAKU_STATUS.DISCONNECTED;
        clearTimeout(this._timeout);
        this.channel_id = null;
        this.sessionID = null;
        this.send({ op: 'destroy', guildId: this.guildID })
            .catch(() => null)
            .finally(() => {
                this._timeout = null;
                this.node.links.delete(this.guildID);
            });
    }
    
    _voiceUpdate(data) {
        this.send({
            op: 'voiceUpdate',
            guildId: this.guildID,
            sessionId: this.sessionID,
            event: data
        }).then(() => {
            this.state = SHOUKAKU_STATUS.CONNECTED;
            this._callback(null, this);
        }).catch((error) => {
            this.state = SHOUKAKU_STATUS.DISCONNECTED;
            this._callback(error);
        }).finally(() => this._callback = null);    
    }
}
module.exports = ShoukakuLink;