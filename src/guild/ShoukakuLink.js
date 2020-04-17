const { ShoukakuStatus } = require('../constants/ShoukakuConstants.js');
const ShoukakuError = require('../constants/ShoukakuError.js');

/**
 * ShoukakuLink, contains data about the voice connection on the guild.
 * @class ShoukakuLink
 */
class ShoukakuLink {
    /**
     * @param {ShoukakuSocket} node The node that governs this link.
     * @param {ShoukakuPlayer} player The player of this link.
     * @param {Guild} guild A Discord.js Guild Object.
     */
    constructor(node, player, guild) {
        /**
         * The node that governs this Link
         * @type {ShoukakuSocket}
         */
        this.node = node;
        /**
         * The player class of this link.
         * @type {ShoukakuPlayer}
         */
        this.player = player;
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
         * If the client user is self defeaned.
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

    stateUpdate(data) {
        this.selfDeaf = data.self_deaf;
        this.selfMute = data.self_mute;
        if (data.channel_id) this.voiceChannelID = data.channel_id;
        if (data.session_id) this.sessionID = data.session_id;
    }

    serverUpdate(data) {
        this.lastServerUpdate = data;
        this._voiceUpdate()
            .then(() => {
                if (this._timeout) clearTimeout(this._timeout);
                if (this.state === ShoukakuStatus.CONNECTING) this.state = ShoukakuStatus.CONNECTED;
                if (this._callback) this._callback(null, this.player);
            })
            .catch((error) => {
                if (this._timeout) clearTimeout(this._timeout);
                if (this.state !== ShoukakuStatus.CONNECTING) return this.player._listen('error', error);
                this.state = ShoukakuStatus.DISCONNECTED;
                if (this._callback) this._callback(error);
            })
            .finally(() => {
                this._callback = null;
                this._timeout = null;
            });
    }

    /**
     * Attempts to reconnect this connection.
     * @memberOf ShoukakuLink
     * @returns {Promise<ShoukakuPlayer>}
     */
    attemptReconnect() {
        return new Promise((resolve, reject) => {
            if (!this.voiceChannelID) return reject(new ShoukakuError('No voice channel to reconnect to'));
            setTimeout(() => {
                if (this.state !== ShoukakuStatus.DISCONNECTED) return reject(new ShoukakuError('You can only reconnect connections that are on Disconnected State'));
                this._connect({
                    guildID: this.guildID,
                    voiceChannelID: this.voiceChannelID,
                    mute: this.selfMute,
                    deaf: this.selfDeaf
                }, (error) => {
                    if (error) return reject(error);
                    resolve(this.player);
                });
            }, 1000);
        });
    }

    _connect(options, callback) {
        if (!options || !callback)
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

        const { guildID, voiceChannelID, deaf, mute } = options;
        this._sendDiscordWS({ guild_id: guildID, channel_id: voiceChannelID, self_deaf: deaf, self_mute: mute });
    }

    _disconnect() {
        if (this.state !== ShoukakuStatus.DISCONNECTED) this.state = ShoukakuStatus.DISCONNECTING;
        this.node.players.delete(this.guildID);
        this.player.removeAllListeners();
        this.player._resetPlayer();
        this._clearVoice();
        this._destroy()
            .catch((error) => this.node.shoukaku.emit('error', this.node.name, error))
            .finally(() => {
                if (this.state !== ShoukakuStatus.DISCONNECTED) {
                    this._sendDiscordWS({ guild_id: this.guildID, channel_id: null, self_mute: false, self_deaf: false });
                    this.state = ShoukakuStatus.DISCONNECTED;
                }
            });
    }

    async _move(node) {
        await this._destroy();
        this.node.players.delete(this.guildID);
        this.node = node;
        await this._voiceUpdate();
        this.node.players.set(this.guildID, this.player);
        await this.player._resume();
    }

    _destroy() {
        return this.node.send({ op: 'destroy', guildId: this.guildID });
    }

    _voiceUpdate() {
        return this.node.send({ op: 'voiceUpdate', guildId: this.guildID, sessionId: this.sessionID, event: this.lastServerUpdate });
    }

    _sendDiscordWS(d) {
        const guild = this.node.shoukaku.client.guilds.cache.get(this.guildID);
        if (!guild) return;
        guild.shard.send({ op: 4, d });
    }

    _clearVoice() {
        this.lastServerUpdate = null;
        this.sessionID = null;
        this.voiceChannelID = null;
    }

    _nodeDisconnected() {
        this.player._listen('nodeDisconnect', new ShoukakuError(`Node: ${this.node.name} disconnected. Either there is no more nodes available to migrate to, or moveOnDisconnect is disabled.`));
        this._disconnect();
    }
}
module.exports = ShoukakuLink;
