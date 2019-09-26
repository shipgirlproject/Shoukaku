const { RawRouter, ReconnectRouter } = require('./router/ShoukakuRouter.js');
const constants = require('./constants/ShoukakuConstants.js');
const ShoukakuError = require('./constants/ShoukakuError.js');
const ShoukakuSocket = require('./node/ShoukakuSocket.js');
const EventEmitter = require('events');

/**
 * @external Client
 * @see {@link https://discord.js.org/#/docs/main/master/class/Client}
 */
/**
 * @external Guild
 * @see {@link https://discord.js.org/#/docs/main/master/class/Guild}
 */
/**
 * @external EventEmitter
 * @see {@link https://nodejs.org/api/events.html}
 */
/**
 * @external Map
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map}
 */


/**
  * Shoukaku, governs the client's node connections.
  * @class Shoukaku
  * @extends {external:EventEmitter}
  */
class Shoukaku extends EventEmitter {
    /**
     * @param  {external:Client} client Your Discord.js client
     * @param {ShoukakuConstants#ShoukakuOptions} [options=ShoukakuOptions] Options to initialize Shoukaku with
     */
    constructor(client, options) {
        super();
        /**
        * The instance of Discord.js client used with Shoukaku.
        * @type {external:Client}
        */
        this.client = client;
        /**
        * The user id of the bot that is being governed by Shoukaku.
        * @type {?string}
        */
        this.id = null;
        /**
        * The shard count of the bot that is being governed by Shoukaku.
        * @type {?number}
        */
        this.shardCount = null;
        /**
        * The current nodes that is being handled by Shoukaku.
        * @type {external:Map}
        */
        this.nodes = new Map();

        Object.defineProperty(this, 'options', { value: this._mergeDefault(constants.ShoukakuOptions, options) });
        Object.defineProperty(this, 'rawRouter', { value: RawRouter.bind(this) });
        Object.defineProperty(this, 'reconnectRouter', { value: ReconnectRouter.bind(this) });
    }
    /**
     * Gets all the Players that is currently active on all nodes in this instance.
     * @type {external:Map}
     * @memberof Shoukaku
     */
    get players() {
        const players = new Map();
        for (const node of this.nodes.values()) {
            for (const [id, player] of node.players) players.set(id, player);
        }
        return players;
    }
    /**
     * Gets the number of total Players that is currently active on all nodes in this instance.
     * @type {number}
     * @memberof Shoukaku
     */
    get totalPlayers() {
        let counter = 0;
        for (const node of this.nodes.values()) counter += node.players.size;
        return counter;
    }

    /**
     * Emitted when a Lavalink Node sends a debug event.
     * @event Shoukaku#debug
     * @param {string} name The name of the Lavalink Node that sent a debug event.
     * @param {Object} data The actual debug data
     * @memberof Shoukaku
     */
    /**
     * Emitted when a lavalink Node encouters an error. This event MUST BE HANDLED.
     * @event Shoukaku#error
     * @param {string} name The name of the Lavalink Node that sent an error event or 'Shoukaku' if the error is from Shoukaku.
     * @param {Error} error The error encountered.
     * @memberof Shoukaku
     * @example
     * // <Shoukaku> is your own instance of Shoukaku
     * <Shoukaku>.on('error', console.error);
     */
    /** name, code, reason, isReconnectable
     * Emitted when a Lavalink Node becomes Ready from a Reconnection or First Connection.
     * @event Shoukaku#ready
     * @param {string} name The name of the Lavalink Node that sent a ready event.
     * @param {boolean} reconnect True if the session reconnected, otherwise false.
     * @memberof Shoukaku
     */
    /**
     * Emitted when a Lavalink Node closed.
     * @event Shoukaku#closed
     * @param {string} name The name of the Lavalink Node that sent a close event.
     * @param {number} code The WebSocket close code https://github.com/Luka967/websocket-close-codes
     * @param {reason} reason The reason for this close event.
     * @memberof Shoukaku
     */
    /**
     * Emitted when a Lavalink Node will not try to reconnect again.
     * @event Shoukaku#disconnected
     * @param {string} name The name of the Lavalink Node that sent a close event.
     * @param {string} reason The reason for the disconnect.
     * @memberof Shoukaku
     */

    /**
     * The starting point of Shoukaku, must be called in ready event in order for Shoukaku to work.
     * @param {ShoukakuConstants#ShoukakuNodeOptions} nodes An array of lavalink nodes for Shoukaku to connect to.
     * @param {ShoukakuConstants#ShoukakuBuildOptions} options Options that is need by Shoukaku to build herself.
     * @memberof Shoukaku
     * @returns {void}
     */
    start(nodes, options) {
        if (this.id)
            throw new ShoukakuError('You already started Shoukaku, you don\'t need to start her again.');
        options = this._mergeDefault(constants.ShoukakuBuildOptions, options);
        this.id = options.id;
        this.shardCount = options.shardCount;
        for (let node of nodes) {
            node = this._mergeDefault(constants.ShoukakuNodeOptions, node);
            this.addNode(node);
        }
        this.client.on('raw', this.rawRouter);
        this.client.on('shardReady', this.reconnectRouter);
    }
    /**
    * Function to register a Lavalink Node
    * @param {ShoukakuConstants#ShoukakuNodeOptions} nodeOptions The Node Options to be used to connect to.
    * @memberof Shoukaku
    * @returns {void}
    */
    addNode(nodeOptions) {
        if (!this.id)
            throw new ShoukakuError('You didn\'t start Shoukaku once. Please call .start() method once before using this.');
        const node = new ShoukakuSocket(this, nodeOptions);
        node.connect(this.id, this.shardCount, false);
        node.on('debug', (name, data) => this.emit('debug', name, data));
        node.on('error', (name, error) => this.emit('error', name, error));
        const _close = this._reconnect.bind(this);
        const _ready = this._ready.bind(this);
        node.on('ready', _ready);
        node.on('close', _close);
        this.nodes.set(node.name, node);
    }
    /**
     * Function to remove a Lavalink Node
     * @param {string} name The Lavalink Node to remove
     * @param {string} reason Optional reason for this disconnect.
     * @memberof Shoukaku
     * @returns {boolean} true if the node was removed with no problems. Otherwise false.
     */
    removeNode(name, reason) {
        if (!this.id)
            throw new ShoukakuError('You didn\'t start Shoukaku once. Please call .start() method once before using this.');
        const node = this.nodes.get(name);
        if (!node) return false;
        node.removeAllListeners();
        node._executeCleaner();
        this.nodes.delete(name);
        this.emit('disconnected', name, reason);
        return true;
    }
    /**
     * Shortcut to get the Ideal Node or a manually specified Node from the current nodes that Shoukaku governs.
     * @param {boolean|string} [name] If blank, Shoukaku will automatically return the Ideal Node for you to connect to. If name is specifed, she will try to return the node you specified.
     * @memberof Shoukaku
     * @returns {ShoukakuSocket}
     * @example
     * const node = <Shoukaku>.getNode();
     * node.rest.resolve('Kongou Burning Love', 'youtube')
     *     .then(data => {
     *         node.joinVoiceChannel({
     *             guildID: 'guild_id',
     *             voiceChannelID: 'voice_channel_id'
     *         }).then(player => player.playTrack(data.track))
     *     })
     */
    getNode(name) {
        if (!this.id)
            throw new ShoukakuError('You didn\'t start Shoukaku once. Please call .start() method once before using this.');
        if (!this.nodes.size)
            throw new ShoukakuError('No nodes available. What happened?');
        if (name) {
            const node = this.nodes.get(name);
            if (node) {
                if (node.state !== constants.ShoukakuStatus.CONNECTED)
                    throw new ShoukakuError('This node is not yet ready');
                return node;
            }
            throw new ShoukakuError('The node name you specified is not one of my nodes');
        }
        const nodes = [...this.nodes.values()].filter(node => node.state === constants.ShoukakuStatus.CONNECTED);
        if (!nodes.length)
            throw new ShoukakuError('No nodes are ready for communication.');
        return nodes.sort((a, b) => a.penalties - b.penalties).shift();
    }
    /**
    * Shortcut to get the Player of a guild, if there is any.
    * @param {string} guildID The guildID of the guild we are trying to get.
    * @memberof Shoukaku
    * @returns {?ShoukakuPlayer}
    */
    getPlayer(guildID) {
        if (!this.id)
            throw new ShoukakuError('You didn\'t start Shoukaku once. Please call .start() method once before using this.');
        if (!guildID) return null;
        if (!this.nodes.size) return null;
        return this.players.get(guildID);
    }

    send(payload) {
        const guild = this.client.guilds.get(payload.d.guild_id);
        if (!guild) return;
        guild.shard.send(payload);
    }

    _ready(name, resumed) {
        const node = this.nodes.get(name);
        if (!resumed) node._executeCleaner();
        this.emit('ready', name, resumed);
    }

    _reconnect(name, code, reason) {
        this.emit('close', name, code, reason);
        const node = this.nodes.get(name);
        if (node.reconnectAttempts < this.options.reconnectTries) {
            node.reconnectAttempts++;
            try {
                node.connect(this.id, this.shardCount, this.options.resumable);
            } catch (error) {
                this.emit('error', name, error);
                setTimeout(() => this._reconnect(name, code, reason), 2500);
                return;
            }
        } else {
            this.removeNode(name, `Failed to reconnect in ${this.options.reconnectTries} attempts`);
            return;
        }   
    }

    _mergeDefault(def, given) {
        if (!given) return def;
        const defaultKeys = Object.keys(def);
        for (const key of defaultKeys) {
            if (def[key] === null) {
                if (!given[key]) throw new ShoukakuError(`${key} was not found from the given options.`);
            }
            if (!given[key]) given[key] = def[key];
        }
        for (const key in defaultKeys) {
            if (defaultKeys.includes(key)) continue;
            delete given[key];
        }
        return given;
    }
}
module.exports = Shoukaku;
