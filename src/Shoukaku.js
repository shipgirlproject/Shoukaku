const { RawRouter, ReconnectRouter } = require('./ShoukakuRouter.js');
const constants = require('./ShoukakuConstants.js');
const ShoukakuSocket = require('./ShoukakuSocket.js');
const EventEmitter = require('events');

/**
 * @external Client
 * @see {@link https://discord.js.org/#/docs/main/master/class/Client}
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
 * Emitted when a Lavalink Node sends a debug event.
 * @event Shoukaku#debug
 * @param {string} name The name of the Lavalink Node that sent a debug event.
 * @param {Object} data The actual debug data
 */
/**
 * Emitted when a lavalink Node encouters an error. This event MUST BE HANDLED.
 * @event Shoukaku#error
 * @param {string} name The name of the Lavalink Node that sent an error event or 'Shoukaku' if the error is from Shoukaku.
 * @param {error} error The error encountered.
 * @example
 * // <Shoukaku> is your own instance of Shoukaku
 * <Shoukaku>.on('error', console.error);
 */
/** name, code, reason, isReconnectable
 * Emitted when a Lavalink Node becomes Ready from a Reconnection or First Connection.
 * @event Shoukaku#ready
 * @param {string} name The name of the Lavalink Node that sent a ready event.
 * @param {boolean} reconnect True if the session reconnected, otherwise false.
 */
/**
 * Emitted when a Lavalink Node closed.
 * @event Shoukaku#closed
 * @param {string} name The name of the Lavalink Node that sent a close event.
 * @param {number} code The WebSocket close code https://github.com/Luka967/websocket-close-codes
 * @param {reason} reason The reason for this close event.
 */
/**
 * Emitted when a Lavalink Node will not try to reconnect again.
 * @event Shoukaku#disconnected
 * @param {string} name The name of the Lavalink Node that sent a close event.
 * @param {string} reason The reason for the disconnect.
 */
/**
 * Shoukaku, governs the client's node connections.
 * @extends {external:EventEmitter}
 * @param  {external:Client} client Your Discord.js client
 * @param {ShoukakuConstants#ShoukakuOptions} [options=ShoukakuOptions] Options to initialize Shoukaku with
 */
class Shoukaku extends EventEmitter {
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
        * @type {?string}
        */
        this.shardCount = null;
        /**
        * The current nodes that is being handled by Shoukaku.
        * @type {external:Map}
        */
        this.nodes = new Map();
        Object.defineProperty(this, 'options', { value: this._mergeDefault(constants.ShoukakuOptions, options) });
        Object.defineProperty(this, 'init', { value: true, writable: true });
        Object.defineProperty(this, 'rawRouter', { value: RawRouter.bind(this) });
        Object.defineProperty(this, 'reconnectRouter', { value: ReconnectRouter.bind(this) });
    }
    /**
    * The starting point of Shoukaku, must be called in ready event in order for Shouaku to work.
    * @param {ShoukakuConstants#ShoukakuNodeOptions} nodes An array of lavalink nodes for Shoukaku to connect to.
    * @param {ShoukakuConstants#ShoukakuBuildOptions} options Options that is need by Shoukaku to build herself.
    * @returns {void}
    */
    build(nodes, options) {
        if (!this.init) throw new Error('You cannot build Shoukaku twice');
        options = this._mergeDefault(constants.ShoukakuBuildOptions, options);
        this.id = options.id;
        this.shardCount = options.shardCount;
        for (let node of nodes) {
            node = this._mergeDefault(constants.ShoukakuNodeOptions, node);
            this.addNode(node);
        }
        this.client.on('raw', this.rawRouter);
        this.client.on('shardReady', this.reconnectRouter);
        this.init = false;
    }
    /**
    * Function to register a Lavalink Node
    * @param {ShoukakuConstants#ShoukakuNodeOptions} nodeOptions An array of lavalink nodes for Shoukaku to connect to.
    * @returns {void}
    */
    addNode(nodeOptions) {
        const node = new ShoukakuSocket(this, nodeOptions);
        node.connect(this.id, this.shardCount);
        const _close = this._reconnect.bind(this);
        const _ready = this._ready.bind(this);
        node.on('debug', (name, data) => this.emit('debug', name, data));
        node.on('error', (name, error) => this.emit('error', name, error));
        node.on('ready', _ready);
        node.on('close', _close);
        this.nodes.set(node.name, node);
    }
    /**
    * Shortcut to get the Ideal Node or a manually specified Node from the current nodes that Shoukaku governs.
    * @param {string} [name] If null, Shoukaku will automatically return the Ideal Node for you to connect to. If name is specifed, she will try to return the node you specified.
    * @returns {ShoukakuSocket}
    */
    getNode(name) {
        if (!this.nodes.size)
            throw new Error('No nodes available. What happened?');
        if (name) {
            const node = this.nodes.get(name);
            if (node) return node;
            throw new Error('The node name you specified is not one of my nodes');
        }
        return [...this.nodes.values()].sort((a, b) => a.penalties - b.penalties).shift();
    }
    /**
    * Shortcut to get the Link of a guild, if there is any.
    * @param {string} [guildID] The guildID of the guild we are trying to get.
    * @returns {?ShoukakuLink}
    */
    getLink(guildID) {
        if (!guildID) return null;
        if (!this.nodes.size) 
            throw new Error('No nodes available. What happened?');
        for (const node of this.nodes.values()) {
            const link = node.links.get(guildID);
            if (link) return link;
        }
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
        const node = this.nodes.get(name);
        if (node.reconnectAttempts < this.options.reconnectTries) {
            node.reconnectAttempts++;
            try {
                node.connect(this.id, this.shardCount, this.options.resumable);
            } catch (error) {
                this.emit('error', 'Shoukaku', error);
                setTimeout(() => this._reconnect(name, code, reason), 2500);
                return;
            }
        } else {
            node.removeAllListeners();
            this.nodes.delete(name);
            this.emit('disconnected', name, `Failed to reconnect in ${this.options.reconnectTries} attempts`);
            return;
        }
        this.emit('close', name, code, reason);
    }

    _mergeDefault(def, given) {
        if (!given) return def;
        const defaultKeys = Object.keys(def);
        for (const key of defaultKeys) {
            if (def[key] === null) {
                if (!given[key]) throw new Error(`${key} was not found from the given options.`);
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