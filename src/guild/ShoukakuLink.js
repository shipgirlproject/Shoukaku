const { promisify } = require('util');
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
        Object.defineProperty(this, 'callback', { value: null, writable: true });
        Object.defineProperty(this, 'timeout', { value: null, writable: true });
    }

    /**
     * Attempts to reconnect this connection.
     * @memberOf ShoukakuLink
     * @returns {Promise<ShoukakuPlayer>}
     */
    async attemptReconnect() {
        if (!this.voiceChannelID) 
            throw new ShoukakuError('No voice channel to reconnect to');
        if (this.state !== ShoukakuStatus.DISCONNECTED) 
            throw new ShoukakuError('You can only reconnect connections that are on disconnected state');
        const options = {
            guildID: this.guildID,
            voiceChannelID: this.voiceChannelID,
            mute: this.selfMute,
            deaf: this.selfDeaf
        };
        await promisify(this.connect.bind(this))(options);
        return this.player;
    }

    async move(node) {
        await this.node.send({ op: 'destroy', guildId: this.guildID });
        this.node.players.delete(this.guildID);
        this.node = node;
        await this.node.send({ op: 'voiceUpdate', guildId: this.guildID, sessionId: this.sessionID, event: this.lastServerUpdate });
        this.node.players.set(this.guildID, this.player);
        await this.player.resume()
            .catch(error => this.player.emit('error', error));
    }

    send(d) {
        const guild = this.node.shoukaku.client.guilds.cache.get(this.guildID);
        if (!guild) return;
        guild.shard.send({ op: 4, d });
    }

    stateUpdate(data) {
        this.selfDeaf = data.self_deaf;
        this.selfMute = data.self_mute;
        if (data.channel_id) this.voiceChannelID = data.channel_id;
        if (data.session_id) this.sessionID = data.session_id;
        if (!data.channel_id && this.state !== ShoukakuStatus.CONNECTING) this.state = ShoukakuStatus.DISCONNECTED;
    }

    serverUpdate(data) {
        this.lastServerUpdate = data;
        this.node.send({ op: 'voiceUpdate', guildId: this.guildID, sessionId: this.sessionID, event: this.lastServerUpdate })
            .then(() => {
                clearTimeout(this.timeout);
                if (this.state === ShoukakuStatus.CONNECTING) this.state = ShoukakuStatus.CONNECTED;
                if (this.callback) this.callback(null, this.player);
            })
            .catch(error => {
                clearTimeout(this.timeout);
                if (this.state !== ShoukakuStatus.CONNECTING)
                    return this.player.emit('error', error);
                this.send({ guild_id: this.guildID, channel_id: null, self_mute: false, self_deaf: false });
                this.state = ShoukakuStatus.DISCONNECTED;
                if (this.callback) this.callback(error);            
            })
            .finally(() => {
                this.callback = null;
                this.timeout = null;
            });
    }
    
    connect(options, callback) {
        if (!callback)
            throw new ShoukakuError('No callback supplied.');

        if (!options) {
            callback(new ShoukakuError('No options supplied'));
            return;
        }

        if (this.state === ShoukakuStatus.CONNECTING) {
            callback(new ShoukakuError('Can\'t connect while a connection is connecting. Wait for it to resolve first'));
            return;
        }

        this.state = ShoukakuStatus.CONNECTING;
        this.callback = callback;
        this.timeout = setTimeout(() => {
            this.send({ guild_id: this.guildID, channel_id: null, self_mute: false, self_deaf: false });
            this.state = ShoukakuStatus.DISCONNECTED;
            clearTimeout(this.timeout);
            this.timeout = null;
            this.callback(new ShoukakuError('The voice connection is not established in 20 seconds'));
            this.callback = null;
        }, 20000);
        
        const { guildID, voiceChannelID, deaf, mute } = options;
        this.send({ guild_id: guildID, channel_id: voiceChannelID, self_deaf: deaf, self_mute: mute });
    }

    disconnect() {
        if (this.state !== ShoukakuStatus.DISCONNECTED) this.state = ShoukakuStatus.DISCONNECTING;
        this.node.players.delete(this.guildID);
        this.player.removeAllListeners();
        this.player.reset(true);
        this.lastServerUpdate = null;
        this.sessionID = null;
        this.voiceChannelID = null;
        this.node.send({ op: 'destroy', guildId: this.guildID })
            .catch(error => this.node.shoukaku.emit('error', this.node.name, error))
            .finally(() => {
                if (this.state === ShoukakuStatus.DISCONNECTED) return;
                this.send({ guild_id: this.guildID, channel_id: null, self_mute: false, self_deaf: false });
                this.state = ShoukakuStatus.DISCONNECTED;
            });
    }
}
module.exports = ShoukakuLink;
