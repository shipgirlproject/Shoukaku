const { ShoukakuStatus, ShoukakuNodeStats, ShoukakuJoinOptions } = require('../constants/ShoukakuConstants.js');
const { PacketRouter, EventRouter } = require('../router/ShoukakuRouter.js');
const ShoukakuResolver = require('../rest/ShoukakuResolver.js');
const ShoukakuLink = require('../guild/ShoukakuLink.js');
const Websocket = require('ws');
const EventEmitter = require('events');
class ShoukakuSocket extends EventEmitter {
    /**
     * ShoukakuSocket, governs the Lavalink Connection and Lavalink Voice Connections.
     * @extends {external:EventEmitter}
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
        * The mapped links that is being governed by this Socket.
        * @type {external:Map}
        */
        this.links = new Map();
        /**
        * The REST server of this Socket, mostly to load balance your REST requests instead of relying on a single node.
        * @type {ShoukakuResolver}
        */
        this.rest = new ShoukakuResolver(node.host, node.port, node.auth, shoukaku.options.restTimeout);
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
    /**
    * Penalties of this Socket. The higher the return number, the more loaded the server is.
    * @type {number}
    */
    get penalties() {
        let penalties = 0;
        penalties += this.stats.players;
        penalties += Math.round(Math.pow(1.05, 100 * this.stats.cpu.systemLoad) * 10 - 10);
        penalties += this.stats.frameStats.deficit;
        penalties += this.stats.frameStats.nulled * 2;
        return penalties;
    }
    /**
    * Connects this Socket.
    * @param {string} id Your Bot's / Client user id.
    * @param {number} shardCount Your Bot's / Client shard count.
    * @param {boolean|string} resumable Determines if we should try to resume the connection.
    * @returns {void}
    */
    connect(id, shardCount, resumable) {
        const headers = {};
        Object.defineProperty(headers, 'Authorization', { value: this.auth, enumerable: true });
        Object.defineProperty(headers, 'Num-Shards', { value: shardCount, enumerable: true });
        Object.defineProperty(headers, 'User-Id', { value: id, enumerable: true });
        if (resumable) Object.defineProperty(headers, 'Resume-Key', { value: resumable, enumerable: true });
        const upgrade = this._upgrade.bind(this);
        const open = this._open.bind(this);
        const message = this._message.bind(this);
        const error = this._error.bind(this);
        const close = this._close.bind(this);
        this.ws = new Websocket(this.url, { headers });
        this.ws.on('upgrade', upgrade);
        this.ws.on('open', open);
        this.ws.on('message', message);
        this.ws.on('error', error);
        this.ws.on('close', close);
        this.shoukaku.on('packetUpdate', this.packetRouter);
    }
    /**
     * Joins then creates a ShoukakuLink Object for the guild & voice channel you specified.
     * @param {ShoukakuConstants#ShoukakuJoinOptions} options Join data to send.
     * @returns {Promise<ShoukakuLink>}
     * @example
     * <ShoukakuSocket>.joinVoiceChannel({
     *     guildID: 'guild_id',
     *     voiceChannelID: 'voice_channel_id'
     * }).then((link) => link.player.playTrack('lavalink_track'));
     */
    joinVoiceChannel(options = ShoukakuJoinOptions) {
        return new Promise((resolve, reject) => {
            if (!options.guildID || !options.voiceChannelID)
                return reject(new Error('Guild ID or Channel ID is not specified.'));

            const link = this.links.get(options.guildID);
            if (link)
                return reject(new Error('A voice connection is already established in this channel.'));

            const guild = this.shoukaku.client.guilds.get(options.guildID);
            if (!guild)
                return reject(new Error('Guild not found. Cannot continue creating the voice connection.'));

            const newLink = new ShoukakuLink(this, guild);
            this.links.set(guild.id, newLink);

            const _object = {
                guild_id: options.guildID,
                channel_id: options.voiceChannelID,
                self_deaf: options.deaf,
                self_mute: options.mute
            };

            newLink.connect(_object, (error, value) => {
                if (error) {
                    this.links.delete(guild.id);
                    reject(error);
                    return;
                }
                resolve(value);
            });
        });
    }

    send(data) {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== 1) return resolve(false);
            let payload;
            try {
                payload = JSON.stringify(data);
            } catch (error) {
                return reject(error);
            }
            this.ws.send(payload, (error) => {
                error ? reject(error) : resolve(true);
            });
        });
    }

    _configureResuming() {
        return this.send({
            op: 'configureResuming',
            key: this.resumable,
            timeout: this.resumableTimeout
        });
    }

    _configureCleaner(state) {
        this.cleaner = state;
    }

    _executeCleaner() {
        if (!this.cleaner) return this._configureCleaner(true);
        for (const link of this.links.values()) link._nodeDisconnected();
    }

    _upgrade(response) {
        this.resumed = response.headers['session-resumed'] === 'true';
    }

    _open() {
        if (this.resumable)
            this._configureResuming()
                .catch((error) => this.emit('error', this.name, error));
        this.reconnectAttempts = 0;
        this.state = ShoukakuStatus.CONNECTED;
        this.emit('ready', this.name, this.resumed);
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
        this.ws.close(4011, 'Reconnecting the Websocket');
    }

    _close(code, reason) {
        this.ws.removeAllListeners();
        this.shoukaku.removeListener('packetUpdate', this.packetRouter);
        this.ws = null;
        this.emit('close', this.name, code, reason);
    }
}
module.exports = ShoukakuSocket;
