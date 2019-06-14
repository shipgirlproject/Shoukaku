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

    set serverUpdate(data) {
        this.lastServerUpdate = data;
        this.voiceUpdate(data);
    }

    connect(options, callback) {
        this._callback = callback;
        this.link.shoukaku.send({
            op: 4,
            d: options
        });
        this.state = SHOUKAKU_STATUS.CONNECTING;
    }

    disconnect() {
        this.state = SHOUKAKU_STATUS.DISCONNECTING;
        this.lastServerUpdate = null;
        this.link.shoukaku.send({
            op: 4,
            d: {
                guild_id: this.guildID,
                channel_id: null,
                self_mute: false,
                self_deaf: false
            }
        });
    }

    voiceDisconnect() {
        this.state = SHOUKAKU_STATUS.DISCONNECTED;
        this.channel_id = null;
        this.sessionID = null;
        this.node.send({
            op: 'destroy',
            guildId: this.guildID
        }).catch(() => null).finally(() => this.node.links.delete(this.guildID));
    }
    
    voiceUpdate(packet) {
        this.send({
            op: 'voiceUpdate',
            guildId: this.guildID,
            sessionId: this.sessionID,
            event: packet
        }).then(() => {
            this.state = SHOUKAKU_STATUS.CONNECTED;
            this._callback(null, this);
        }).catch((error) => {
            this.state = SHOUKAKU_STATUS.DISCONNECTED;
            this._callback(error);
        }).finally(() => delete this._callback);    
    }

    send(data) {
        return this.node.send(data);
    }
}
module.exports = ShoukakuLink;