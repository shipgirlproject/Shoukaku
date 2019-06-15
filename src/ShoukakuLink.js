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
        this._clearVoice();
        this.player._clearTrack();
        this.player.removeAllListeners();
        this.node.links.delete(this.guildID);
        if (this.state !== SHOUKAKU_STATUS.DISCONNECTED) this._destroy();
        if (!this.node.shoukaku.client.guilds.has(this.guildID)) return;
        this.node.shoukaku.send({
            op: 4,
            d: {
                guild_id: this.guildID,
                channel_id: null,
                self_mute: false,
                self_deaf: false    
            }
        });
        this.state = SHOUKAKU_STATUS.DISCONNECTED;
    }

    _clearVoice() {
        this.lastServerUpdate = null;
        this.sessionID = null;
        this.voiceChannelID = null;
    }

    _voiceUpdate(data) {
        this.node.send({
            op: 'voiceUpdate',
            guildId: this.guildID,
            sessionId: this.sessionID,
            event: data
        }).then(() => {
            this.state = SHOUKAKU_STATUS.CONNECTED;
            if (this._callback) this._callback(null, this);
        }).catch((error) => {
            this.state = SHOUKAKU_STATUS.DISCONNECTED;
            if (this._callback) this._callback(error);
        }).finally(() => this._callback = null);    
    }

    _voiceDisconnect() {
        this.state = SHOUKAKU_STATUS.DISCONNECTED;
        this._destroy();
    }

    _destroy() {
        this.node.send({ 
            op: 'destroy', 
            guildId: this.guildID 
        }).catch(() => null);
    }
}
module.exports = ShoukakuLink;