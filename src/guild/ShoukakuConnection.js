const AbortController = require('abort-controller');
const { EventEmitter, once } = require('events');
const { state } = require('../Constants.js');
// const { wait } = require('../Utils.js');

/**
 * ShoukakuConnection, manages a voice connection between Discord and Lavalink
 * @class ShoukakuConnection
 * @extends {EventEmitter}
 */
class ShoukakuConnection extends EventEmitter {
    /**
     * @param {ShoukakuPlayer} player The player of this link.
     * @param {ShoukakuSocket} node The node that governs this link.
     * @param {Guild} guild A Discord.js Guild Object.
     */
    constructor(player, node, guild) {
        super();
        /**
         * The player class of this link.
         * @type {ShoukakuPlayer}
         */
        this.player = player;
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
         * The ID of the shard where this guild id is
         * @type {number}
         */
        this.shardID = guild.shardID;
        /**
         * The sessionID of this Link
         * @type {?string}
         */
        this.sessionID = null;
        /**
         * The ID of the voice channel that is being governed by this link.
         * @type {?string}
         */
        this.channelID = null;
        /**
         * Voice region where this link is connected.
         * @type {?string}
         */
        this.region = null;
        /**
         * If the client user is self muted.
         * @type {boolean}
         */
        this.muted = false;
        /**
         * If the client user is self defeaned.
         * @type {boolean}
         */
        this.deafened = false;
        /**
         * Voice connection status to Discord
         * @type {ShoukakuConstants#ShoukakuStatus}
         */
        this.state = state.DISCONNECTED;
        /**
         * If this link detected a voice channel change.
         * @type {boolean}
         */
        this.channelMoved = false;
        /**
         * If this link detected a voice server change.
         * @type {boolean}
         */
        this.voiceMoved = false;
        /**
         * If this link is reconnecting via ShoukakuLink.attemptReconnect()
         * @type {boolean}
         */
        this.reconnecting = false;

        Object.defineProperty(this, 'serverUpdate', { value: null, writable: true });
        Object.defineProperty(this, 'connectTimeout', { value: null, writable: true });
    }

    /**
     * Attempts to reconnect this ShoukakuLink, A use case for this is when your Discord Websocket re-identifies
     * @memberOf ShoukakuLink
     * @param {Object} [options] options for attemptReconnect
     * @param {String} [options.voiceChannelID] Will throw an error if not specified, when the state of this link is disconnected, no cached serverUpdate or when forceReconnect is true
     * @param {Boolean} [options.forceReconnect] Forces a reconnection by re-requesting a connection to Discord, also resets your player
     * @returns {Promise<ShoukakuPlayer>}
     *
    async attemptReconnect({ voiceChannelID, forceReconnect } = {}) {
        if (this.state === DISCONNECTED || !this.serverUpdate || forceReconnect) {
            if (!voiceChannelID)
                throw new ShoukakuError('Please specify the channel you want this node to connect on');
            try {
                this.reconnecting = true;
                await this.node.send({ op: 'destroy', guildId: this.guildID });
                await wait(3000);
                if (this.state !== DISCONNECTED) {
                    // probably I'll rewrite this into a promise way, :eyes:
                    this.send({ guild_id: this.guildID, channel_id: null, self_mute: false, self_deaf: false }, true);
                    await wait(3000);
                }
                this.serverUpdate = null;
                await this.connect({ guildID: this.guildID, voiceChannelID, mute: this.selfMute, deaf: this.selfDeaf });
                this.reconnecting = false;
            } catch (error) {
                this.reconnecting = false;
                throw error;
            }
        }
        else if (this.state === CONNECTED && !forceReconnect) await this.voiceUpdate();
        return this.player;
    }
    */
    setDeaf(deaf = false, reason) {
        return this
            .node
            .shoukaku
            .client
            .api
            .members(this.node.shoukaku.id)
            .patch({ data: { deaf }, reason });
    }

    setMute(mute = false, reason) {
        return this
            .node
            .shoukaku
            .client
            .api
            .members(this.node.shoukaku.id)
            .patch({ data: { mute }, reason });
    }

    moveChannel(channel = null, reason) {
        return this
            .node
            .shoukaku
            .client
            .api
            .members(this.node.shoukaku.id)
            .patch({ data: { channel }, reason });
    }
    
    async connect(options) {
        if (!options) 
            throw new Error('No options supplied');
        if (this.state === state.CONNECTING)
            throw Error('Can\'t connect while a connection is connecting. Wait for it to resolve first');
        this.state = state.CONNECTING;
        const { guildID, voiceChannelID, deaf, mute } = options;
        this.send({ guild_id: guildID, channel_id: voiceChannelID, self_deaf: deaf, self_mute: mute });
        this.node.emit('debug', this.node.name, '[Voice] -> [Discord] : Requesting Connection');
        const signal = new AbortController();
        const timeout = setTimeout(() => signal.abort(), 15000);
        try {
            await once(this, 'serverUpdate', { signal });
        } catch (error) {
            this.node.emit('debug', this.node.name, '[Voice] </- [Discord] : Request Connection Failed' );
            if (error.name === 'AbortError') 
                throw new Error('The voice connection is not established in 15 seconds');
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    disconnect() {
        if (this.state !== state.DISCONNECTED) {
            this.state = state.DISCONNECTING;
            this.send({ guild_id: this.guildID, channel_id: null, self_mute: false, self_deaf: false }, true);
        }
        this.node.players.delete(this.guildID);
        this.node.send({ op: 'destroy', guildId: this.guildID });
        this.player.removeAllListeners();
        this.player.reset();
        this.state = state.DISCONNECTED;
        this.node.emit('debug', this.node.name, '[Voice] -> [Node] [Discord] : Link & Player Destroyed');
    }

    setStateUpdate({ session_id, channel_id, self_deaf, self_mute }) {
        if (!channel_id) this.state = state.DISCONNECTED;
        this.channelMoved = this.channelID && this.channelID !== channel_id;
        this.deafened = self_deaf;
        this.muted = self_mute;
        this.sessionID = session_id;
        this.channelID = channel_id || this.channelID;
        this.node.emit('debug', this.node.name, '[Voice] <- [Discord] : State Update');
        this.emit('stateUpdate');
    }

    setServerUpdate(data) {
        if (!data.endpoint) return;
        clearTimeout(this.connectTimeout);
        this.voiceMoved = this.serverUpdate && !data.endpoint.startsWith(this.region);
        this.region = data.endpoint.split('.').shift().replace(/[0-9]/g, '');
        this.serverUpdate = data;
        this.node.send({ op: 'voiceUpdate', guildId: this.guildID, sessionId: this.sessionID, event: this.serverUpdate });
        this.node.emit('debug', this.node.name, '[Voice] <- [Discord] : Server Update');
        this.emit('serverUpdate');
    }

    send(d, important = false) {
        if (!this.node.shoukaku.client.guilds.cache.has(this.guildID)) return;
        this.node.shoukaku.client.ws.shards.get(this.shardID)?.send({ op: 4, d }, important);
    }
}

module.exports = ShoukakuConnection;
