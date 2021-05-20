const EventEmitter = require('events');
const ShoukakuSocket = require('./node/ShoukakuSocket.js');

const { options, state, nodeOptions } = require('./Constants.js');
const { mergeDefault, getVersion } = require('./Utils.js');

/**
  * Shoukaku, governs the client's lavalink node connections.
  * @class Shoukaku
  * @extends {EventEmitter}
  */
class Shoukaku extends EventEmitter {
    /**
     * @param {Client} client Your Discord.js client
     * @param {ShoukakuConstants#ShoukakuNodes} nodes Lavalink Nodes where Shoukaku will try to connect to.
     * @param {ShoukakuConstants#ShoukakuOptions} suppliedOptions Options to initialize Shoukaku with
     */
    constructor(client, nodes, suppliedOptions) {
        super();
        const { variant, version } = getVersion();
        if (variant === 'light') {
            if (!version.startsWith('3'))
                throw new Error('Shoukaku will only work at Discord.JS-light v3. Versions below Discord.JS-light v3 is not supported');
        } else {
            if (!version.startsWith('12'))
                throw new Error('Shoukaku will only work at Discord.JS v12. Versions below Discord.JS v12 is not supported');
        }
        if (!nodes?.length) 
            throw new Error('No nodes supplied');
        /**
        * The instance of Discord.js client used with Shoukaku.
        * @type {external.Client}
        */
        this.client = client;
        /**
        * The user id of the bot that is being governed by Shoukaku.
        * @type {?string}
        */
        this.id = null;
        /**
        * The current nodes that is being handled by Shoukaku.
        * @type {Map<string, ShoukakuSocket>}
        */
        this.nodes = new Map();

        Object.defineProperty(this, 'options', { value: mergeDefault(options, suppliedOptions) });

        this.client.once('ready', () => this._onClientReady(nodes));
        this.client.on('raw', event => this._onClientRaw(event));
    }

    /**
     * Gets all the Players that is currently active on all nodes in this instance.
     * @type {Map<string, ShoukakuPlayer>}
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
     * Debug related things, enable if you have an issue and planning to report it to the developer of this Lib.
     * @event Shoukaku#debug
     * @param {string} name The name of the ShoukakuSocket that sent a debug event.
     * @param {Object} data The actual debug data
     * @memberof Shoukaku
     */
    /**
     * Emitted when a ShoukakuSocket encounters an internal error, MUST BE HANDLED.
     * @event Shoukaku#error
     * @param {string} name The name of the ShoukakuSocket that sent an error event.
     * @param {Error} error The error encountered.
     * @memberof Shoukaku
     * @example
     * Shoukaku.on('error', console.error);
     */
    /** 
     * Emitted when a ShoukakuSocket becomes Ready from a reconnection or first initialization.
     * @event Shoukaku#ready
     * @param {string} name The name of the ShoukakuSocket that sent a ready event.
     * @param {boolean} reconnect true if the session reconnected, otherwise false.
     * @memberof Shoukaku
     */
    /**
     * Emitted when a ShoukakuSocket closed it's websocket connection to a Lavalink Server.
     * @event Shoukaku#close
     * @param {string} name The name of the ShoukakuSocket that sent a close event.
     * @param {number} code The WebSocket close code https://github.com/Luka967/websocket-close-codes
     * @param {reason} reason The reason for this close event.
     * @memberof Shoukaku
     */
    /**
     * Emitted when a ShoukakuSocket is removed and will not try to reconnect again.
     * @event Shoukaku#disconnected
     * @param {string} name The name of the ShoukakuSocket that sent a close event.
     * @param {string} reason The reason for the disconnect.
     * @memberof Shoukaku
     */

    /**
    * Function to register a new ShoukakuSocket
    * @param {ShoukakuConstants#ShoukakuNodeOptions} nodeOptions The Node Options to be used to connect to.
    * @memberof Shoukaku
    * @returns {void}
    */
    addNode(nodeOptions) {
        const node = new ShoukakuSocket(this, nodeOptions);
        node.on('debug', (...args) => this.emit('debug', ...args));
        node.on('error', (...args) => this.emit('error', ...args));
        node.on('disconnect', (...args) => this.emit('disconnected', ...args));
        node.on('ready', (...args) => this._ready(...args));
        node.on('close', (...args) => this._close(...args));
        node.connect();
        this.nodes.set(node.name, node);
    }
    /**
     * Function to remove an existing ShoukakuSocket
     * @param {string} name The Lavalink Node to remove
     * @param {string} [reason] Optional reason for this disconnect.
     * @memberof Shoukaku
     * @returns {void}
     */
    removeNode(name, reason = 'Remove node executed') {
        const node = this.nodes.get(name);
        if (!node) throw new Error('The node name you specified doesn\'t exist');
        this.nodes.delete(node.name);
        node.disconnect(1000, reason);
        node.removeAllListeners();
    }
    /**
     * Shortcut to get the Ideal Node or a manually specified Node from the current nodes that Shoukaku governs.
     * @param {string|Array<string>} [query] If blank, Shoukaku will return an ideal node from default group of nodes. If a string is specified, will return a node from it's name, if an array of string groups, Shoukaku will return an ideal node from the specified array of grouped nodes.
     * @memberof Shoukaku
     * @returns {ShoukakuSocket}
     * @example
     * const node = Shoukaku.getNode();
     * node.rest.resolve('Kongou Burning Love', 'youtube')
     *     .then(data => 
     *         node.joinVoiceChannel({ guildID: 'guild_id', voiceChannelID: 'voice_channel_id' })
     *             .then(player => player.playTrack(data.track))   
     *     )
     */
    getNode(query) {
        if (!this.nodes.size) throw new Error('No nodes available, please add a node first');
        if (!query || Array.isArray(query)) return this._getIdeal(query);
        const node = this.nodes.get(query);
        if (!node) throw new Error('The node name you specified is not one of my nodes');
        if (node.state !== state.CONNECTED) throw new Error('This node is not yet ready');
        return node;
    }
    
    _ready(name, resumed) {
        const node = this.nodes.get(name);
        node._clean();
        this.emit('ready', name, resumed);
    }

    _close(name, code, reason) {
        const node = this.nodes.get(name);
        if (!node) return;
        this.emit('close', name, code, reason);
        this._reconnect(node);
    }

    _reconnect(node) {
        if (node.reconnectAttempts >= this.options.reconnectTries) {
            this.removeNode(node.name, `Can't reconnect after ${this.options.reconnectTries} attempt(s)`);
            return;
        }
        node.reconnectAttempts++;
        node.emit('debug', node.name, '[Shoukaku] -> [Node] : Reconnecting');
        setTimeout(() => node.connect(this.id, this.options.resumable), this.options.reconnectInterval);
    }

    _getIdeal(group) {
        const nodes = [...this.nodes.values()]
            .filter(node => node.state === state.CONNECTED);
        if (!group) {
            return nodes
                .sort((a, b) => a.penalties - b.penalties)
                .shift();
        }
        return nodes
            .filter(node => group.includes(node.group))
            .sort((a, b) => a.penalties - b.penalties)
            .shift();
    }

    _onClientReady(nodes) {
        this.emit('debug', 'Manager',
            '[Shoukaku] [Manager] : Client Ready, Connecting Nodes\n' +
            `Client ID            : ${this.client.user.id}\n` +
            `Initial Nodes        : ${nodes.length}`
        );
        this.id = this.client.user.id;
        for (const node of nodes) this.addNode(mergeDefault(nodeOptions, node));
    }

    _onClientRaw(packet) {
        if (!['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(packet.t)) return;
        for (const node of this.nodes.values()) node._onClientFilteredRaw(packet);
    }
}
module.exports = Shoukaku;
