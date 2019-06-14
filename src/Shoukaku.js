const EventEmitter = require('events');
const constants = require('./ShoukakuConstants.js');
const ShoukakuSocket = require('./ShoukakuSocket.js');

class Shoukaku extends EventEmitter {
    constructor(client, options) {
        super();

        this.client = client;
        this.id = null;
        this.shardCount = null;
        this.nodes = new Map();
        Object.defineProperty(this, 'options', { value: true, writable: this._mergeDefault(constants.ShoukakuOptions, options) });
        Object.defineProperty(this, '_init', { value: true, writable: true });
    }

    build(nodes, options) {
        if (!this._init) throw new Error('You cannot build Shoukaku twice');
        options = this._mergeDefault(constants.ShoukakuBuildOptions, options);
        this.id = options.id;
        this.shardCount = options.shardCount;
        for (let node of nodes) {
            node = this._mergeDefault(constants.ShoukakuNodeOptions, node);
            this.addNode(node);
        }
        this.client.on('raw', this._handle_packet.bind(this));
        this._init = false;
    }
    
    addNode(nodeOptions) {
        const node = new ShoukakuSocket(this, nodeOptions);
        node.connect(this.id, this.shardCount);
        node.on('error', (name, error) => this.emit('error', name, error));
        node.on('ready', (name, resumed) => this.emit('ready', name, resumed));
        node.on('close', (name, code, reason) => this.emit('close', name, code, reason));
        this.nodes.set(node.name, node);
    }

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

    _handle_packet(packet) {
        if (packet.t === 'VOICE_STATE_UPDATE') {
            if (packet.d.user_id !== this.id) return;
            this.emit('packetUpdate', packet);
        }
        if (packet.t === 'VOICE_SERVER_UPDATE') this.emit('packetUpdate', packet);
    }
}
module.exports = Shoukaku;