const EventEmitter = require('events');
const Websocket = require('ws');
const ShoukakuQueue = require('./ShoukakuQueue.js');
const ShoukakuRest = require('./ShoukakuRest.js');
const ShoukakuPlayer = require('../guild/ShoukakuPlayer.js');
const ShoukakuNodeStatus = require('../struct/ShoukakuNodeStatus.js');

const { state } = require('../Constants.js');

/**
 * ShoukakuSocket, manages a single Lavalink node connection.
 * @class ShoukakuSocket
 */
class ShoukakuSocket extends EventEmitter {
    /**
     * @extends {EventEmitter}
     * @param {Shoukaku} shoukaku Your Shoukaku Instance
     * @param {ShoukakuOptions} node ShoukakuNodeOptions Options to initialize Shoukaku with
     */
    constructor(shoukaku, node) {
        super();
        /**
        * The manager instance of this socket
        * @type {Shoukaku}
        */
        this.shoukaku = shoukaku;
        /**
        * The players being governed by this node
        * @type {Map<string, ShoukakuPlayer>}
        */
        this.players = new Map();
        /**
        * The rest api for this socket
        * @type {ShoukakuRest}
        */
        this.rest = new ShoukakuRest(node, shoukaku.options);
        /**
        * List of queued websocket reqeusts
        * @type {ShoukakuQueue}
        */
        this.queue = new ShoukakuQueue(this);
        /**
        * The state of this socket
        * @type {ShoukakuConstants#ShoukakuStatus}
        */
        this.state = state.DISCONNECTED;
        /**
        * The stats of this socket
        * @type {ShoukakuNodeStatus}
        */
        this.stats = new ShoukakuNodeStatus();
        /**
        * Attempted reconnects of this socket. Resets to 0 when the socket opens properly
        * @type {number}
        */
        this.reconnects = 0;
        /**
        * Name of this socket
        * @type {string}
        */
        this.name = node.name;
        /**
        * Group of this socket
        * @type {?string}
        */
        this.group = node.group;
        /**
        * Websocket URL of this socket
        * @type {string}
        */
        this.url = `${node.secure ? 'wss' : 'ws'}://${node.url}`;
        /**
        * If this socket was resumed
        * @type {boolean}
        */
        this.resumed = false;

        Object.defineProperty(this, 'auth', { value: node.auth });
    }

    get userAgent() {
        return this.shoukaku.options.userAgent;
    }

    get resumable() {
        return this.shoukaku.options.resumable;
    }

    get resumableTimeout() {
        return this.shoukaku.options.resumableTimeout;
    }

    get moveOnDisconnect() {
        return this.shoukaku.options.moveOnDisconnect;
    }
    
    /**
    * Penalties of this Socket. The higher the return number, the more loaded the server is.
    * @type {number}
    * @memberof ShoukakuSocket
    * @protected
    */
    get penalties() {
        let penalties = 0;
        penalties += this.stats.players;
        penalties += Math.round(Math.pow(1.05, 100 * this.stats.cpu.systemLoad) * 10 - 10);
        if (this.stats.frameStats) {
            penalties += this.stats.frameStats.deficit;
            penalties += this.stats.frameStats.nulled * 2;
        }
        return penalties;
    }
    
    /**
    * Connects this Socket
    * @memberof ShoukakuSocket
    * @param {boolean} [reconnect=false]
    * @returns {void}
    * @protected
    */
    connect(reconnect = false) {
        this.state = state.CONNECTING;
        const headers = {
            'Client-Name': this.userAgent,
            'User-Agent': this.userAgent,
            'Authorization': this.auth,
            'User-Id': this.shoukaku.id
        };
        if (reconnect) headers['Resume-Key'] = (!!this.resumable).toString(); 
        this.emit('debug', this.name, '[Node] -> [Lavalink] : Connecting');
        this.ws = new Websocket(this.url, { headers });
        this.ws.once('upgrade', response => this.resumed = response.headers['session-resumed'] === 'true');
        this.ws.once('open', () => this._open());
        this.ws.once('close', (...args) => this._close(...args));
        this.ws.on('error', error => this.emit('error', this.name, error));
        this.ws.on('message', (...args) => this._message(...args));
    }
    /**
    * Disconnects this Socket
    * @memberof ShoukakuSocket
    * @param {number} [code=1000]
    * @param {string} [reason]
    * @returns {void}
    * @protected
    */
    disconnect(code = 1000, reason) {
        this._clean();
        this.ws?.close(code, reason);
        this.ws?.removeAllListeners();
    }
    /**
     * Creates a player and connects your bot to the specified guild's voice channel
     * @param {ShoukakuConstants#ShoukakuJoinOptions} options join data to send
     * @memberof ShoukakuSocket
     * @returns {Promise<ShoukakuPlayer>}
     * @example
     * ShoukakuSocket.joinVoiceChannel({ guildID: 'guild_id', channelID: 'voice_channel_id' })
     *     .then((player) => player.playTrack('lavalink_track')); 
     */
    async joinChannel(options = {}) {
        if (!options.guildID || !options.channelID)
            throw new Error('Supplied options needs to have "guildID" and "channelID" ids');
        if (this.state !== state.CONNECTED)
            throw new Error('This node is not yet ready');

        const guild = this.shoukaku.client.guilds.cache.get(options.guildID);
        if (!guild)
            throw new Error('Guild not found, cannot continue creating this connection');

        const player = this.players.get(guild.id) || new ShoukakuPlayer(this, guild);

        try {
            if (!this.players.has(guild.id)) this.players.set(guild.id, player);
            await player.connection.connect(options);
            return player;
        } catch (error) {
            this.players.delete(guild.id);
            throw error;
        }
    }
    /**
     * Eventually Disconnects the VoiceConnection & Removes the Player from a Guild.
     * @param {string} guildID The guild id of the player you want to remove.
     * @memberOf ShoukakuSocket
     * @returns {void}
     */
    leaveChannel(guildID) {
        return this.players.get(guildID)?.connection.disconnect();
    }
    /**
     * Enqueues a message to be sent to Lavalink Server
     * @param {Object} data Message to be sent
     * @memberOf ShoukakuSocket
     * @returns {void}
     * @protected
     */
    send(data, important) {
        return this.queue.send(JSON.stringify(data), important);
    }
    /**
     * @memberOf ShoukakuSocket
     * @returns {void}
     * @protected
     */
    _open() {
        if (this.resumable) {
            this.send({
                op: 'configureResuming',
                key: (!!this.resumable).toString(),
                timeout: this.resumableTimeout
            });
        }
        this.reconnectAttempts = 0;
        this.state = state.CONNECTED;
        this.emit('debug', this.name, '[Node] <- [Lavalink] : Node Ready');
        this.emit('ready', this.name, this.resumed);
    }
    /**
     * @memberOf ShoukakuSocket
     * @returns {void}
     * @protected
     */
    _message(message) {
        const json = JSON.parse(message);
        this.emit('debug', this.name, '[Node] <- [Lavalink Websocket] : Websocket Message');
        if (!json) return;
        if (json.op === 'stats') {
            this.stats = new ShoukakuNodeStatus(json);
            return;
        }
        this.players.get(json.guildId)?._onLavalinkMessage(json);
    }
    /**
     * @memberOf ShoukakuSocket
     * @returns {void}
     * @protected
     */
    _close(code, reason) {
        this.ws.removeAllListeners();
        this.ws = null;
        this.state = state.DISCONNECTED;
        this.emit('debug', this.name, 
            '[Node] <- [Lavalink Websocket] : Websocket Closed\n' +
            `  Node                         : ${this.name}\n` +
            `  Code                         : ${code || '1000'}\n` +
            `  Reason                       : ${reason || 'Unknown'}`
        );
        this.emit('close', this.name, code, reason);
    }
    /**
     * @memberOf ShoukakuSocket
     * @returns {void}
     * @protected
     */
    _clientRaw(packet) {
        const player = this.players.get(packet.d.guild_id);
        if (!player) return;
        if (packet.t === 'VOICE_SERVER_UPDATE') {
            player.connection.setServerUpdate(packet.d);
            return;
        }
        if (packet.d.user_id !== this.shoukaku.id) return;
        player.connection.setStateUpdate(packet.d);
    }
    /**
     * @memberOf ShoukakuSocket
     * @returns {void}
     * @protected
     */ 
    _clean() {
        if (this.resumed) return;
        if (this.moveOnDisconnect && this.shoukaku.nodes.size > 0) {
            for (const player of [...this.players.values()]) {
                player
                    .moveNode(this.shoukaku._getIdeal(this.group))
                    .catch(error => player.emit('error', error));
            }
            return;
        }
        const error = new Error(
            this.moveOnDisconnect ? `Node '${this.name}' disconnected; moveOnReconnect is disabled` : `Node '${this.name}' disconnected; No nodes to reconnect to`
        );
        const players = [...this.players.values()];
        for (const player of players) player.connection.disconnect();
        this.emit('disconnected', this.name, players, error);
    }
}
module.exports = ShoukakuSocket;
