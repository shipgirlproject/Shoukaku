const { promisify } = require('util');
const { ShoukakuStatus, ShoukakuNodeStats, ShoukakuJoinOptions } = require('../constants/ShoukakuConstants.js');
const { PacketRouter, EventRouter } = require('../router/ShoukakuRouter.js');
const { websocketSend } = require('../util/ShoukakuUtil.js');
const ShoukakuError = require('../constants/ShoukakuError.js');
const ShoukakuRest = require('../rest/ShoukakuRest.js');
const ShoukakuPlayer = require('../guild/ShoukakuPlayer.js');
const Websocket = require('ws');
const EventEmitter = require('events');
/**
 * ShoukakuSocket, manages a single Lavalink WS connection.
 * @class ShoukakuSocket
 */
class ShoukakuSocket extends EventEmitter {
    /**
     * @extends {EventEmitter}
     * @param  {Shoukaku} shoukaku Your Shoukaku Instance
     * @param {ShoukakuOptions} node ShoukakuNodeOptions Options to initialize Shoukaku with
     */
    constructor(shoukaku, node) {
        super();
        /**
        * The Instance of Shoukaku where this node initialization is called.
        * @type {Shoukaku}
        */
        this.shoukaku = shoukaku;
        /**
        * The active players in this socket/node.
        * @type {Map<string, ShoukakuPlayer>}
        */
        this.players = new Map();
        /**
        * The REST API of this Socket, mostly to load balance your REST requests instead of relying on a single node.
        * @type {ShoukakuRest}
        */
        this.rest = new ShoukakuRest(node.host, node.port, node.auth, shoukaku.options.restTimeout);
        /**
        * The state of this Socket.
        * @type {ShoukakuConstants#ShoukakuStatus}
        */
        this.state = ShoukakuStatus.DISCONNECTED;
        /**
        * The current stats of this Socket.
        * @type {ShoukakuConstants#ShoukakuNodeStats}
        */
        this.stats = ShoukakuNodeStats;
        /**
        * Attempted reconnects of this Socket. Resets to 0 when the socket opens properly.
        * @type {number}
        */
        this.reconnectAttempts = 0;
        /**
        * Name of this Socket that you can use on .getNode() method of Shoukaku.
        * @type {string}
        */
        this.name = node.name;

        Object.defineProperty(this, 'url', { value: `ws://${node.host}:${node.port}` });
        Object.defineProperty(this, 'auth', { value: node.auth });
        Object.defineProperty(this, 'resumed', { value: false, writable: true });
        Object.defineProperty(this, 'cleaner', { value: false, writable: true });
        Object.defineProperty(this, 'packetRouter', { value: PacketRouter.bind(this) });
        Object.defineProperty(this, 'eventRouter', { value: EventRouter.bind(this) });
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
    * Connects this Socket.
    * @param {string} id Your Bot's / Client user id.
    * @param {number} shardCount Your Bot's / Client shard count.
    * @param {boolean|string} resumable Determines if we should try to resume the connection.
    * @memberof ShoukakuSocket
    * @returns {void}
    */
    connect(id, shardCount, resumable) {
        this.state = ShoukakuStatus.CONNECTING;
        const headers = {
            'Authorization': this.auth,
            'Num-Shards': shardCount,
            'User-Id': id
        };
        if (resumable) headers['Resume-Key'] = resumable;
        this.ws = new Websocket(this.url, { headers });
        this.ws.once('upgrade', this._upgrade.bind(this));
        this.ws.once('open', this._open.bind(this));
        this.ws.once('error', this._error.bind(this));
        this.ws.once('close', this._close.bind(this));
        const message = this._message.bind(this);
        this.ws.on('message', message);
        this.shoukaku.on('packetUpdate', this.packetRouter);
    }
    /**
     * Creates a player and connects your bot to the specified guild's voice channel
     * @param {ShoukakuConstants#ShoukakuJoinOptions} options Join data to send.
     * @memberof ShoukakuSocket
     * @returns {Promise<ShoukakuPlayer>}
     * @example
     * <ShoukakuSocket>.joinVoiceChannel({
     *     guildID: 'guild_id',
     *     voiceChannelID: 'voice_channel_id'
     * }).then((player) => player.playTrack('lavalink_track'));
     */
    async joinVoiceChannel(options = ShoukakuJoinOptions) {
        if (!options.guildID || !options.voiceChannelID)
            throw new ShoukakuError('Guild ID or Channel ID is not specified.');

        if (this.state !== ShoukakuStatus.CONNECTED)
            throw new ShoukakuError('This node is not yet ready.');

        let player = this.players.get(options.guildID);
        if (player) {
            if (player.voiceConnection.state === ShoukakuStatus.CONNECTED) return player;
            throw new ShoukakuError('This player is not yet connected, please wait for it to connect');
        }

        const guild = this.shoukaku.client.guilds.cache.get(options.guildID);
        if (!guild)
            throw new ShoukakuError('Guild not found, cannot continue creating this connection.');

        player = new ShoukakuPlayer(this, guild);
        this.players.set(guild.id, player);
        try {
            await promisify(player.connect.bind(player))(options);
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
    leaveVoiceChannel(guildID) {
        const player = this.players.get(guildID);
        if (!player) return;
        player.disconnect();
    }

    async send(data) {
        if (!this.ws || this.ws.readyState !== 1) return;
        await websocketSend(this.ws, JSON.stringify(data));
    }

    async configureResuming() {
        if (!this.resumable) return;
        await this.send({
            op: 'configureResuming',
            key: this.resumable,
            timeout: this.resumableTimeout
        });
    }

    async executeCleaner() {
        if (!this.cleaner) return this.cleaner = true;
        const nodes = [...this.shoukaku.nodes.values()].filter(node => node.state === ShoukakuStatus.CONNECTED);
        if (this.moveOnDisconnect && nodes.length > 0) {
            for (const player of this.players.values()) {
                await player.moveToNode(nodes.sort((a, b) => a.penalties - b.penalties).shift())
                    .catch(error => this.emit('error', this.name, error));
            }
        } else {
            for (const player of this.players.values()) {
                player.emit('nodeDisconnect', new ShoukakuError(`Node '${this.name}' disconnected, either there is no more nodes available to migrate to, or moveOnDisconnect is disabled.`));
                player.voiceConnection.disconnect();
            }
        }
    }

    _upgrade(response) {
        this.resumed = response.headers['session-resumed'] === 'true';
    }

    _open() {
        this.configureResuming()
            .then(() => {
                this.reconnectAttempts = 0;
                this.state = ShoukakuStatus.CONNECTED;
                this.emit('ready', this.name, this.resumed);
            })
            .catch(error => {
                this.emit('error', this.name, error);
                this.ws.close(4011, 'Failed to send the resume packet');
            });
    }

    _message(message) {
        try {
            const json = JSON.parse(message);
            if (json.op !== 'playerUpdate') this.emit('debug', this.name, json);
            if (json.op === 'stats') return this.stats = json;
            this.eventRouter(json);
        } catch (error) {
            this.emit('error', this.name, error);
        }
    }

    _error(error) {
        this.emit('error', this.name, error);
        this.ws.close(4011, 'Reconnecting the Websocket due to an error');
    }

    _close(code, reason) {
        this.state = ShoukakuStatus.DISCONNECTED;
        this.ws.removeAllListeners();
        this.shoukaku.removeListener('packetUpdate', this.packetRouter);
        this.ws = null;
        this.emit('close', this.name, code, reason);
    }
}
module.exports = ShoukakuSocket;
