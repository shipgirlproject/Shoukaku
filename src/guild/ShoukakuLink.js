const EventEmitter = require('events');
const { ShoukakuStatus } = require('../constants/ShoukakuConstants.js');
const { CONNECTED, CONNECTING, DISCONNECTING, DISCONNECTED } = ShoukakuStatus;
const ShoukakuError = require('../constants/ShoukakuError.js');
const { wait } = require('../util/ShoukakuUtil.js');

/**
 * ShoukakuLink, contains data about the voice connection on the guild.
 * @class ShoukakuLink
 * @extends {EventEmitter}
 */
class ShoukakuLink extends EventEmitter {
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
        this.voiceChannelID = null;
        /**
         * The ID of the last voice channel that is being governed by this link.
         * @type {?string}
         */
        this.lastVoiceChannelID = null;
        /**
         * Voice region where this link is connected.
         * @type {?string}
         */
        this.region = null;
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
         * Voice connection status to Discord
         * @type {ShoukakuConstants#ShoukakuStatus}
         */
        this.state = DISCONNECTED;
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
         * If this link is reconnecting via ShoukakuLink.attemptReconnect() or ShoukakuLink.moveToNode()
         * @type {boolean}
         */
        this.reconnecting = false;

        Object.defineProperty(this, 'serverUpdate', { value: null, writable: true });
        Object.defineProperty(this, 'connectTimeout', { value: null, writable: true });
    }
    /**
     * Average ping of Discord Websocket
     * @type {number}
    */
    get shardPing() {
        return this.shard ? this.shard.ping : this.node.shoukaku.client.ws.ping;
    }

    get guild() {
        return this.node.shoukaku.client.guilds.cache.get(this.guildID);
    }

    get shard() {
        return this.node.shoukaku.client.ws.shards.get(this.shardID);
    }

    /**
     * Attempts to reconnect this ShoukakuLink, A use case for this is when your Discord Websocket re-identifies
     * @memberOf ShoukakuLink
     * @param {Object} [options] options for attemptReconnect
     * @param {String} [options.voiceChannelID] Will throw an error if not specified, when the state of this link is disconnected, no cached serverUpdate or when forceReconnect is true
     * @param {Boolean} [options.forceReconnect] Forces a reconnection by re-requesting a connection to Discord, also resets your player
     * @returns {Promise<ShoukakuPlayer>}
     */
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

    async moveToNode(node) {
        try {
            if (!node) throw new ShoukakuError('No available nodes to reconnect to');
            if (!(node instanceof this.node.constructor)) throw new ShoukakuError('Node is not an instance of ShoukakuSocket');
            this.node.emit('debug', this.node.name, 
                '[Voice] -> [Node] : Moving\n' +
                `  From Node       : ${this.node.name}\n` +
                `  To Node         : ${node.name}\n` +
                `  Guild           : ${this.guildID}\n` + 
                `  Channel         : ${this.voiceChannelID}`
            );
            this.reconnecting = true; 
            await this.node.send({ op: 'destroy', guildId: this.guildID });
            this.node.players.delete(this.guildID);
            this.node = node;
            this.node.players.set(this.guildID, this.player);
            await this.voiceUpdate();
            this.reconnecting = false;
            await this.player.resume();
            this.node.emit('debug', this.node.name, 
                '[Voice] -> [Node] : Moved\n' +
                `  Node            : ${node.name}\n` +
                `  Guild           : ${this.guildID}\n` + 
                `  Channel         : ${this.voiceChannelID}`
            );
        } catch (error) {
            this.reconnecting = false;
            throw error;
        }
    }

    setStateUpdate({ session_id, channel_id, self_deaf, self_mute }) {
        if (!channel_id) this.state = DISCONNECTED;
        this.lastVoiceChannelID = this.voiceChannelID ? this.voiceChannelID.repeat(1) : null;
        this.channelMoved = !!this.lastVoiceChannelID && this.lastVoiceChannelID !== (channel_id || this.lastVoiceChannelID);
        this.selfDeaf = self_deaf;
        this.selfMute = self_mute;
        this.sessionID = session_id;
        this.voiceChannelID = channel_id;
        if (!session_id) return this.authenticateFailed(new ShoukakuError('No session_id intact on Discord State Update OP'));
        this.sessionID = session_id;
        this.node.emit('debug', this.node.name, 
            '[Voice] <- [Discord Websocket] : State Update\n' + 
            `  Guild                        : ${this.guildID}\n` + 
            `  Channel                      : ${channel_id}\n` + 
            `  State                        : ${this.state}\n` + 
            `  Channel Moved?               : ${this.channelMoved}`
        );
    }

    async setServerUpdate(data) {
        try {
            if (!data.endpoint) return;
            clearTimeout(this.connectTimeout);
            this.voiceMoved = this.serverUpdate ? !data.endpoint.startsWith(this.region) : false;
            this.region = data.endpoint.split('.').shift().replace(/[0-9]/g, '');
            this.serverUpdate = data;
            this.node.emit('debug', this.node.name, 
                '[Voice] <- [Discord Websocket] : Server Update\n' + 
                `  Guild                        : ${this.guildID}\n` + 
                `  Region                       : ${this.region}\n` + 
                `  Endpoint                     : ${data.endpoint}\n` + 
                `  Voice Server Moved?          : ${this.voiceMoved}`
            );
            await this.voiceUpdate();
            this.node.emit('debug', this.node.name, 
                '[Voice] -> [Node]     : Forwarded Server Update\n' + 
                `  Node                : ${this.node.name}\n` +
                `  Guild               : ${this.guildID}\n` + 
                `  Region              : ${this.region}\n` + 
                `  Endpoint            : ${data.endpoint}\n` + 
                `  Voice Server Moved? : ${this.voiceMoved}`
            );
            if (this.listenerCount('ready') > 0) this.emit('ready');
        } catch (error) {
            this.authenticateFailed(error);
        }
    }
    
    connect(options) {
        return new Promise((resolve, reject) => {
            if (!options) 
                return reject(new ShoukakuError('No options supplied'));
            if (this.state === CONNECTING)
                return reject(new ShoukakuError('Can\'t connect while a connection is connecting. Wait for it to resolve first'));
            this.state = CONNECTING;
            const { guildID, voiceChannelID, deaf, mute } = options;
            this.once('error', reject);
            this.once('ready', () => {
                clearTimeout(this.connectTimeout);
                this.removeListener('error', reject);
                this.state = CONNECTED;
                resolve();
            });
            this.connectTimeout = setTimeout(() => {
                this.authenticateFailed(new ShoukakuError('The voice connection is not established in 15 seconds'));
                this.node.emit('debug', this.node.name, 
                    '[Voice] </- [Discord Websocket] : Request Connection Timeout\n' + 
                    `  Node                          : ${this.node.name}\n` +
                    `  Guild                         : ${this.guildID}\n` + 
                    `  Channel                       : ${voiceChannelID}`
                );
            }, 15000);
            this.send({ guild_id: guildID, channel_id: voiceChannelID, self_deaf: deaf, self_mute: mute });
            this.node.emit('debug', this.node.name, 
                '[Voice] -> [Discord Websoket] : Requesting Connection\n' + 
                `  Node                        : ${this.node.name}\n` +
                `  Guild                       : ${this.guildID}\n` + 
                `  Channel                     : ${voiceChannelID}\n` + 
                `  Deaf                        : ${!!deaf}\n` + 
                `  Mute                        : ${!!mute}`
            );
        });
    }

    disconnect() {
        if (this.state !== DISCONNECTED) {
            this.state = DISCONNECTING;
            this.send({ guild_id: this.guildID, channel_id: null, self_mute: false, self_deaf: false }, true);
            this.node.emit('debug', this.node.name, 
                '[Voice] -> [Discord Websocket] : Destroyed Connection\n' +
                `  Guild                        : ${this.guildID}`
            );
        }
        this.node.players.delete(this.guildID);
        this.node
            .send({ op: 'destroy', guildId: this.guildID })
            .catch(error => this.node.emit('error', this.node.name, error));
        this.player.removeAllListeners();
        this.player.reset();
        this.serverUpdate = null;
        this.sessionID = null;
        this.voiceChannelID = null;
        this.lastVoiceChannelID = null;
        this.state = DISCONNECTED;
        this.node.emit('debug', this.node.name, 
            '[Voice] -> [Node] : Destroyed Player\n' + 
            `  Node            : ${this.node.name}\n` +
            `  Guild           : ${this.guildID}`
        );
    }

    authenticateFailed(error) {
        clearTimeout(this.connectTimeout);
        this.removeAllListeners('ready');
        this.listenerCount('error') > 0 ? this.emit('error', error) : this.player.emit('error', error);
        this.state = DISCONNECTED;
    }

    send(d, important = false) {
        if (!this.guild) return;
        this.guild.shard.send({ op: 4, d }, important);
    }

    voiceUpdate() {
        return this.node.send({ op: 'voiceUpdate', guildId: this.guildID, sessionId: this.sessionID, event: this.serverUpdate });
    }
}
module.exports = ShoukakuLink;
