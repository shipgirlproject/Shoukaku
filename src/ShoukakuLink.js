const { ShoukakuStatus } = require('./ShoukakuConstants.js');
const ShoukakuPlayer = require('./ShoukakuPlayer.js');
class ShoukakuLink {
    /**
     * ShoukakuLink, the voice connection manager of a guild. Contains the Player Class that can be used to play tracks.
     * @param {ShoukakuSocket} node The node where this class initialization is called.
     * @param {external:Guild} guild the Guild Object of this guild.
     */
    constructor(node, guild) {
        /**
         * The node that governs this Link
         * @type {ShoukakuSocket}
         */
        this.node = node;
        /**
         * The ID of the guild that is being governed by this Link.
         * @type {string}
         */
        this.guildID = guild.id;
        /**
         * The ID of the shard where this guild is in
         * @type {number}
         */
        this.shardID = guild.shardID;
        /**
         * The ID of the user that is being governed by this Link
         * @type {string}
         */
        this.userID = node.shoukaku.id;
        /**
         * The sessionID of this Link
         * @type {?string}
         */
        this.sessionID = null;
        /**
         * The ID of the voice channel that is being governed by this link.
         * @type {?string}
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
         * @type {ShoukakuConstants#ShoukakuStatus}
         */
        this.state = ShoukakuStatus.DISCONNECTED;
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
        this.selfDeaf = data.self_deaf;
        this.selfMute = data.self_mute;
        this.voiceChannelID = data.channel_id;
        this.sessionID = data.session_id;
    }

    set serverUpdate(data) {
        this.lastServerUpdate = data;
        this._voiceUpdate(data);
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
        if (this.state === ShoukakuStatus.CONNECTING)  {
            this._callback(new Error('Can\'t connect a connecting link. Wait for it to resolve first'));
            return;
        }

        this._timeout = setTimeout(() => {
            this.state = ShoukakuStatus.DISCONNECTED;
            this._callback(new Error('The voice connection is not established in 15 seconds'));
        }, 15000);
        this.state = ShoukakuStatus.CONNECTING;
        this._queueConnection(options);
    }
    /**
     * Eventually Disconnects the VoiceConnection from a Guild. Could be also used to clean up player remnants from unexpected events.
     * @returns {void}
     */
    disconnect() {
        this.state = ShoukakuStatus.DISCONNECTING;
        this.node.links.delete(this.guildID);
        this.player.removeAllListeners();  
        this._clearVoice();
        this.player._clearTrack();
        this.player._clearPlayer();
        if (this.state !== ShoukakuStatus.DISCONNECTED) {
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
        this.state = ShoukakuStatus.DISCONNECTED;
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

    _voiceUpdate(event) {
        this.node.send({
            op: 'voiceUpdate',
            guildId: this.guildID,
            sessionId: this.sessionID,
            event
        })
            .then(() => {
                if (this.state !== ShoukakuStatus.CONNECTING) return;
                clearTimeout(this._timeout);
                this.state = ShoukakuStatus.CONNECTED;
                this._callback(null, this);
            })
            .catch((error) => {
                if (this.state === ShoukakuStatus.CONNECTING) {
                    clearTimeout(this._timeout);
                    this.state = ShoukakuStatus.DISCONNECTED;
                    return this._callback(error);
                }
                this.player._listen('voiceClose', error);
            })
            .finally(() => {
                this._callback = null;
                this._timeout = null;
            });
    }

    _voiceDisconnect() {
        this.state = ShoukakuStatus.DISCONNECTED;
        this._destroy();
    }

    _nodeDisconnected() {
        this._clearVoice();
        this._removeConnection(this.guildID);
        this.player._listen('nodeDisconnect', this.name);
    }
}
module.exports = ShoukakuLink;
