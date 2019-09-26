const { ShoukakuStatus } = require('../constants/ShoukakuConstants.js');
const ShoukakuError = require('../constants/ShoukakuError.js');

/**
 * ShoukakuLink, contains data about the voice connection on the guild.
 * @class ShoukakuLink
 */
class ShoukakuLink {
    /**
     * @param {ShoukakuPlayer} player The player of this link.
     * @param {external:Guild} guild A Discord.js Guild Object.
     */
    constructor(player, guild) {
        /**
         * The player class of this link.
         * @type {ShoukakuPlayer}
         */
        this.player = player;
        /**
         * The node that governs this Link
         * @type {ShoukakuSocket}
         */
        this.node = this.player.node;
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
        this.userID = this.node.shoukaku.id;
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

    _connect(d, callback) {
        if (!d || !callback)
            throw new ShoukakuError('No Options or Callback supplied.');

        this._callback = callback;

        if (this.state === ShoukakuStatus.CONNECTING)  {
            this._callback(new ShoukakuError('Can\'t connect while a connection is connecting. Wait for it to resolve first'));
            return;
        }

        this._timeout = setTimeout(() => {
            this.state = ShoukakuStatus.DISCONNECTED;
            this._callback(new ShoukakuError('The voice connection is not established in 15 seconds'));
        }, 15000);

        this.state = ShoukakuStatus.CONNECTING;
        this._send(d);
    }

    _disconnect() {
        this.state = ShoukakuStatus.DISCONNECTING;
        this.node.players.delete(this.guildID);
        this.player.removeAllListeners();
        this._clearVoice();
        this.player._clearTrack();
        this.player._clearPlayer();
        if (this.state !== ShoukakuStatus.DISCONNECTED) {
            this._destroy();
            this._send({
                guild_id: this.guildID,
                channel_id: null,
                self_mute: false,
                self_deaf: false
            });
        }
    }

    async _move(shoukakuSocket) {
        this._destroy();
        this.player.node.players.delete(this.guildID);
        await shoukakuSocket.send({ op: 'voiceUpdate', guildId: this.guildID, sessionId: this.sessionID, event: this.lastServerUpdate });
        shoukakuSocket.players.set(this.guildID, this.player);
        this.player.node = shoukakuSocket;
        await this.player._resume();
    }

    _send(d) {
        this.node.shoukaku.send({ op: 4, d });
    }

    _clearVoice() {
        this.lastServerUpdate = null;
        this.sessionID = null;
        this.voiceChannelID = null;
    }

    _destroy() {
        this.node.send({ op: 'destroy', guildId: this.guildID })
            .catch(() => null);
    }

    _voiceUpdate(event) {
        this.node.send({ op: 'voiceUpdate', guildId: this.guildID, sessionId: this.sessionID, event })
            .then(() => {
                if (this._timeout) clearTimeout(this._timeout);
                if (this.state === ShoukakuStatus.CONNECTING) this.state = ShoukakuStatus.CONNECTED;
                this._callback(null, this.player);
            })
            .catch((error) => {
                if (this._timeout) clearTimeout(this._timeout);
                if (this.state !== ShoukakuStatus.CONNECTING)
                    return this.player._listen('error', error);
                this.state = ShoukakuStatus.DISCONNECTED;
                this._callback(error);
            })
            .finally(() => {
                this._callback = null;
                this._timeout = null;
            });
    }

    _nodeDisconnected() {
        this._clearVoice();
        this._send({
            guild_id: this.guildID,
            channel_id: null,
            self_mute: false,
            self_deaf: false
        });
        this.player._listen('nodeDisconnect', this.node.name);
    }
}
module.exports = ShoukakuLink;
