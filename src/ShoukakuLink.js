const { SHOUKAKU_STATUS } = require('./ShoukakuConstants.js');
const ShoukakuPlayer = require('./ShoukakuPlayer.js');
class ShoukakuLink {
    /**
     * ShoukakuLink, the voice connection manager of a guild. Contains the Player Class that can be used to play tracks.
     * @param {ShoukakuSocket} node The node where this class initialization is called.
     */
    constructor(node) {
        /**
         * The node that governs this Link
         * @type {ShoukakuSocket}
         */
        this.node = node;
        /**
         * The sessionID of this Link
         * @type {string}
         */
        this.sessionID = null;
        /**
         * The ID of the user that is being governed by this Link
         * @type {string}
         */
        this.userID = null;
        /**
         * The ID of the guild that is being governed by this Link.
         * @type {string}
         */
        this.guildID = null;
        /**
         * The ID of the voice channel that is being governed by this link.
         * @type {string}
         */
        this.voiceChannelID = null;
        /**
         * If the client user is self muted.
         * @type {boolean}
         */
        this.selfMute = false;
        /**
         * TIf the client user is self defeaned.
         * @type {boolean}
         */
        this.selfDeaf = false;
        /**
         * The current state of this link.
         * @type {ShoukakuConstants#SHOUKAKU_STATUS}
         */
        this.state = SHOUKAKU_STATUS.DISCONNECTED;
        /**
         * The player class of this link.
         * @type {ShoukakuPlayer}
         */
        this.player = new ShoukakuPlayer(this);

        Object.defineProperty(this, 'lastServerUpdate', { value: null, writable: true });
        Object.defineProperty(this, '_callback', { value: null, writable: true });
        Object.defineProperty(this, '_timeout', { value: null, writable: true });
    }

    set build(data) {
        this.userID = data.user_id;
        this.selfDeaf = data.self_deaf;
        this.selfMute = data.self_mute;
        this.guildID = data.guild_id;
        this.voiceChannelID = data.channel_id;
        this.sessionID = data.session_id;
    }

    set serverUpdate(packet) {
        this.lastServerUpdate = packet.d;
        this._voiceUpdate(packet.d);
    }
    /**
     * Generates a VoiceConnection to the Guild's specific Voice Channel. Warning: DO NOT USE THIS UNLESS YOU HAVE A GOOD REASON TO DO SO. Use `node.joinVoiceChannel()` instead.
     * @param {Object} options The Join Object Format from Discord API Documentation
     * @param {function(error, ShoukakuLink):void} callback The callback to run.
     * @returns {void}
     */
    connect(options, callback) {
        if (!options || !callback)
            throw new Error('No Options or Callback supplied.');
        this._callback = callback;
        if (this.state === SHOUKAKU_STATUS.CONNECTING) 
            return this._callback(new Error('Can\'t connect a connecting link. Wait for it to resolve first'));
        this._timeout = setTimeout(() => {
            this.node.links.delete(options.guild_id);
            this.state = SHOUKAKU_STATUS.DISCONNECTED;
            if (this._callback) this._callback(new Error('The voice connection is not established in 15 seconds'));
        }, 15000);
        this._queueConnection(options);
        this.state = SHOUKAKU_STATUS.CONNECTING;
    }
    /**
     * Eventually Disconnects the VoiceConnection from a Guild. Could be also used to clean up player remnants from unexpected events.
     * @returns {void}
     */
    disconnect() {
        this.state = SHOUKAKU_STATUS.DISCONNECTING;
        this._clearVoice();
        this.player._clearTrack();
        this.player.removeAllListeners();
        this.node.links.delete(this.guildID);
        if (this.state !== SHOUKAKU_STATUS.DISCONNECTED) {
            this._destroy();
            this._removeConnection(this.guildID);
        }
    }

    _queueConnection(d) {
        this.node.shoukaku.send({
            op: 4,
            d
        });
    }

    _removeConnection(guild_id) {
        this.node.shoukaku.send({
            op: 4,
            d: {
                guild_id,
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

    _destroy() {
        this.node.send({
            op: 'destroy',
            guildId: this.guildID
        }).catch(() => null);
    }

    _voiceUpdate(data) {
        this.node.send({
            op: 'voiceUpdate',
            guildId: this.guildID,
            sessionId: this.sessionID,
            event: data
        }).then(() => {
            clearTimeout(this._timeout);
            this.player._listen();
            this.state = SHOUKAKU_STATUS.CONNECTED;
            if (this._callback) this._callback(null, this);
        }).catch((error) => {
            clearTimeout(this._timeout);
            this.node.links.delete(this.guildID);
            this.state = SHOUKAKU_STATUS.DISCONNECTED;
            if (this._callback) this._callback(error);
        }).finally(() => {
            this._callback = null;
            this._timeout = null;
        });
    }

    _voiceDisconnect() {
        this.state = SHOUKAKU_STATUS.DISCONNECTED;
        this._destroy();
    }

    _nodeDisconnected() {
        this._clearVoice();
        this._removeConnection(this.guildID);
        this.player.emit('nodeDisconnect', this.name);
    }
}
module.exports = ShoukakuLink;
