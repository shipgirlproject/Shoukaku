const { EventEmitter, once } = require('events');
const Websocket = require('ws');
const AbortController = require('abort-controller');
const ShoukakuQueue = require('./ShoukakuQueue.js');
const ShoukakuRest = require('../rest/ShoukakuRest.js');
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
        this.rest = new ShoukakuRest(node, shoukaku.options);
        /**
        * List of queued websocket reqeusts
        * @type {ShoukakuQueue}
        */
        this.queue = new ShoukakuQueue(this);
        /**
        * The state of this Socket.
        * @type {ShoukakuConstants#ShoukakuStatus}
        */
        this.state = state.DISCONNECTED;
        /**
        * The current stats of this Socket.
        * @type {ShoukakuNodeStatus}
        */
        this.stats = new ShoukakuNodeStatus();
        /**
        * Attempted reconnects of this Socket. Resets to 0 when the socket opens properly.
        * @type {number}
        */
        this.reconnects = 0;
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
    * @memberof ShoukakuSocket
    * @returns {Promise<void>}
    */
    async connect(reconnect = false) {
        this.state = state.CONNECTING;
        const headers = {
            'Client-Name': this.userAgent,
            'User-Agent': this.userAgent,
            'Authorization': this.auth,
            'User-Id': this.shoukaku.id
        };
        if (reconnect) headers['Resume-Key'] = (!!this.resumable).toString();
        this.emit('debug', this.name, '[Node] -> [Lavalink] : Connecting');
        const signal = new AbortController();
        const timeout = setTimeout(() => signal.abort(), 30000);
        this.ws = new Websocket(this.url, { headers });
        const [ upgrade ] = await Promise.all([ 
            once(this, 'upgrade', { signal }), 
            once(this, 'open' , { signal }) 
        ]);
        clearTimeout(timeout);
        if (this.resumable) {
            this.emit('debug', this.name, '[Node] -> [Lavalink] : Sending Configure Resume Packet');
            this.send({
                op: 'configureResuming',
                key: (!!this.resumable).toString(),
                timeout: this.resumableTimeout
            });
        }
        this.ws.once('close', (...args) => this._close(...args));
        this.ws.on('error', (...args) => this._error(...args));
        this.ws.on('message', (...args) => this._message(...args));
        this.resumed = upgrade.headers['session-resumed'] === 'true';
        if (this.resumed) this.queue.process();
        this.reconnects = 0;
        this.state = state.CONNECTED;
        this.emit('debug', this.name, '[Node] <- [Lavalink] : Node Ready');
        this.emit('ready', this.name, this.resumed);
    }
    /**
    * Disconnects this Socket.
    * @memberof ShoukakuSocket
    * @returns {Promise<void>}
    */
    disconnect(code = 1000, reason) {
        this._cleanUp();
        this.ws?.close(code, reason);
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
    async joinVoiceChannel(options = {}) {
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
            await player.connect(options);
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

    send(data, important) {
        return this.queue.send(JSON.stringify(data), important);
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
        this.emit('debug', this.name, 
            '[Node] <- [Lavalink Websocket] : Websocket Error\n' +
            `  Node                         : ${this.name}\n` +
            `  Error                        : ${error ? error.name : 'Unknown'}`
        );
        this.ws.close(1011, 'Reconnecting the Websocket due to an error');
    }

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

    _onClientFilteredRaw(packet) {
        const player = this.players.get(packet.d.guild_id);
        if (!player) return;
        if (packet.t === 'VOICE_SERVER_UPDATE') {
            player.voiceConnection.setServerUpdate(packet.d);
            return;
        }
        if (packet.d.user_id !== this.shoukaku.id) return;
        player.voiceConnection.setStateUpdate(packet.d);
    }

    async _onLavalinkMessage(json) {
        this.emit('debug', this.name, 
            '[Node] <- [Lavalink Websocket] : Websocket Message\n' +
            `  Node                         : ${this.name}\n` +
            `  OP                           : ${json ? json.op : 'No OP Received'}\n`
        );
        if (!json) return;
        if (json.op === 'stats') {
            this.stats = json;
            const ping = await this.rest.getLatency();
            this.pings.push(ping);
            if (this.pings.length > 3) this.pings.pop();
            return;
        }
        const player = this.players.get(json.guildId);
        if (!player) return;
        await player._onLavalinkMessage(json);
    }

    _clean() {
        if (this.resumed) return;
        if (this.moveOnDisconnect && this.shoukaku.nodes.size > 0) {
            for (const player of [...this.players.values()]) {
                player.voiceConnection
                    .moveNode(this.shoukaku._getIdeal(this.group))
                    .catch(error => player.emit('error', error));
            }
            return;
        }
        const error = new Error(
            this.moveOnDisconnect ? `Node '${this.name}' disconnected; moveOnReconnect is disabled` : `Node '${this.name}' disconnected; No nodes to reconnect to`
        );
        // must be handled by user
        this.emit('disconnect', this.name, this.players, error);
    }
}
module.exports = ShoukakuSocket;
