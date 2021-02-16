const { promisify } = require('util');
const { ShoukakuStatus, ShoukakuNodeStats, ShoukakuJoinOptions } = require('../constants/ShoukakuConstants.js');
const { CONNECTED, CONNECTING, DISCONNECTED } = ShoukakuStatus;
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
        this.rest = new ShoukakuRest(node.host, node.port, node.auth, shoukaku.options.userAgent, shoukaku.options.restTimeout, node.secure);
        /**
        * The state of this Socket.
        * @type {ShoukakuConstants#ShoukakuStatus}
        */
        this.state = DISCONNECTED;
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
        /**
        * Group of this socket
        * @type {?string}
        */
        this.group = node.group;
        /**
        * Websocket URL of this socket
        * @type {string}
        */
        this.url = `ws${node.secure ? 's' : ''}://${node.host}:${node.port}`;
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
    * @param {boolean|string} resumable Determines if we should try to resume the connection.
    * @memberof ShoukakuSocket
    * @returns {void}
    */
    connect(id, resumable) {
        this.state = CONNECTING;
        this.emit('debug', this.name, `[Socket] Connecting => Node ${this.name}`);
        const headers = {
            'Client-Name': this.userAgent,
            'User-Agent': this.userAgent,
            'Authorization': this.auth,
            'User-Id': id
        };
        if (resumable) headers['Resume-Key'] = resumable;
        this.ws = new Websocket(this.url, { headers });
        this.ws.once('upgrade', (...args) => this._upgrade(...args));
        this.ws.once('open', () => this._open());
        this.ws.once('error', (...args) => this._error(...args));
        this.ws.once('close', (...args) => this._close(...args));
        this.ws.on('message', (...args) => this._message(...args));
    }
    /**
     * Creates a player and connects your bot to the specified guild's voice channel
     * @param {ShoukakuConstants#ShoukakuJoinOptions} options Join data to send.
     * @memberof ShoukakuSocket
     * @returns {Promise<ShoukakuPlayer>}
     * @example
     * <ShoukakuSocket>.joinVoiceChannel({ guildID: 'guild_id', voiceChannelID: 'voice_channel_id' })
     *     .then((player) => player.playTrack('lavalink_track')); 
     */
    async joinVoiceChannel(options = ShoukakuJoinOptions) {
        if (!options.guildID || !options.voiceChannelID)
            throw new ShoukakuError('Guild ID or Channel ID is not specified.');

        if (this.state !== CONNECTED)
            throw new ShoukakuError('This node is not yet ready.');

        let player = this.players.get(options.guildID);
        if (player) {
            if (player.voiceConnection.state === CONNECTED) return player;
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
        if (this.resumed) return;
        if (this.moveOnDisconnect && this.shoukaku.nodes.size > 0) {
            const players = [...this.players.values()];
            await Promise.all(players.map(player => player.voiceConnection.moveToNode(this.shoukaku._getIdeal(player.voiceConnection.node.group))));
            return;
        }
        let error;
        if (this.moveOnDisconnect) {
            error = new ShoukakuError(`Node '${this.name}' disconnected; moveOnReconnect is disabled`);
        } else {
            error = new ShoukakuError(`Node '${this.name}' disconnected; No nodes to reconnect to`);
        }
        for (const player of this.players.values()) {
            player.emit('nodeDisconnect', error);
            player.voiceConnection.disconnect();
        }
    }

    _upgrade(response) {
        this.resumed = response.headers['session-resumed'] === 'true';
        this.emit('debug', this.name, `[Socket] Connecting, Upgrade Response Received => Node ${this.name}, Waiting for WS Open Event...`);
    }

    _open() {
        this.configureResuming()
            .then(() => {
                this.reconnectAttempts = 0;
                this.state = CONNECTED;
                this.emit('debug', this.name, `[Socket] Connected => Node ${this.name}, Resumed Connection? ${this.resumed}`);
                this.emit('ready', this.name, this.resumed);
            })
            .catch(error => {
                this.ws.close(1011, 'Failed to send the resume packet');
                this.emit('error', this.name, error);
            });
    }

    async _message(message) {
        try {
            await this._onLavalinkMessage(JSON.parse(message));
        } catch (error) {
            this.emit('error', this.name, error);
        }
    }

    _error(error) {
        this.emit('error', this.name, error);
        this.emit('debug', this.name, `[Socket] Errored, Closing => Node ${this.name}`);
        this.ws.close(1011, 'Reconnecting the Websocket due to an error');
    }

    _close(code, reason) {
        this.ws.removeAllListeners();
        this.ws = null;
        this.state = DISCONNECTED;
        this.emit('debug', this.name, `[Socket] Disconnected => Node ${this.name}`);
        this.emit('close', this.name, code, reason);
    }

    _onClientFilteredRaw(packet) {
        const player = this.players.get(packet.d.guild_id);
        if (!player) return;
        if (packet.t === 'VOICE_SERVER_UPDATE') {
            player.voiceConnection.serverUpdate(packet.d);
            return;
        }
        if (packet.d.user_id !== this.shoukaku.id) return;
        player.voiceConnection.stateUpdate(packet.d);
    }

    async _onLavalinkMessage(json) {
        this.emit('debug', this.name, `[Socket] Message OP: ${json.op} => Node ${this.name}`);
        if (json.op === 'stats') return this.stats = json;
        const player = this.players.get(json.guildId);
        if (!player) return;
        await player._onLavalinkMessage(json);
    }
}
module.exports = ShoukakuSocket;
