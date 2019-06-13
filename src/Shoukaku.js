const EventEmitter = require('events');
const ShoukakuNode = require('./ShoukakuNode.js');
const ShoukakuPlayer = require('./ShoukakuPlayer.js');
const ShoukakuConstants = require('./ShoukakuConstants.js');

class Shoukaku extends EventEmitter {
    constructor(client, options) {
        super();
        if (!client) throw new Error('Discord.JS client not specified');
        if (!options) throw new Error('Shoukaku Options is not specified');

        Object.defineProperty(this, 'client', { value: client });
        Object.defineProperty(this, 'options', { 
            value: this._mergeDefault(ShoukakuConstants.ShoukakuOptions, options) 
        });
        Object.defineProperty(this, 'pending', { value: new Map() });

        this.id = null;
        this.shardCount = null;
        this.nodes = new Map();
        this.players = new Map();
        this.created = false;
    }

    buildManager(data, nodes) {
        if (this.created)
            throw new Error('You cannot rebuild the Shoukaku Manager once its built');
        data = this._mergeDefault(ShoukakuConstants.ShoukakuBuildData, data);
        this.id = data.id;
        this.shardCount = data.shardCount || 1;
        for (let node of nodes) {
            node = this._mergeDefault(ShoukakuConstants.ShoukakuNodeObject, node);
            this.createShoukakuNode(node);
        }
        this.client.on('raw', (p) => {
            if (p.t !== 'VOICE_STATE_UPDATE' && p.t !== 'VOICE_SERVER_UPDATE') return;
            this._update(p);
        });
        this.created = true;
    }

    createShoukakuNode(node) {
        if (!node)
            throw new Error('Cannot create a node if the node data is missing');
        node = this._mergeDefault(ShoukakuConstants.ShoukakuNodeObject, node);
        const connection = new ShoukakuNode(this, this.options, node);
        try {
            connection.on('ready', (host) => this.emit('nodeReady', host));
            connection.on('message', this._message.bind(this));
            connection.on('stats', (node, host) => this.emit('nodeStats', node, host));
            connection.on('reconnecting', (host) => this.emit('nodeReconnecting', host));
            connection.on('resumed', (host) => this.emit('nodeResumed', host));
            connection.on('newSession', (host) => this.emit('nodeNewSession', host));
            connection.on('disconnect', this._disconnect.bind(this));
            connection.on('error', (error, host) => this.emit('nodeError', error, host));
            connection.connect();
            this.nodes.set(connection.host, connection);
        } catch (error) {
            if (connection.ws) {
                connection.ws.removeAllListeners();
                connection.ws = null;
            }
            connection.removeAllListeners();
            throw error;
        }
    }

    removeShoukakuNode(host) {
        if (!this.nodes.has(host)) return false;
        for (const player of this.players.values()) {
            if (player.node.host === host) player._removedNode();
        }
        this.nodes.get(host).removeAllListeners();
        return this.nodes.delete(host);
    }

    join(host, guildID, channelID, selfDeaf = false, selfMute = false) {
        return new Promise((resolve, reject) => {
            if (this.pending.has(guildID)) 
                throw new Error('There is a pending join request in this guild');
            const exists = this.players.get(guildID);
            if (exists) 
                return resolve(exists);
            const node = this.nodes.get(host);
            if (!node) return reject(new Error(`The node ${node.host} is not a valid node.`));
            if (node.nodeStatus !== 'Ready') return reject(new Error(`The node ${node.host} is not yet ready`));
            const player = new ShoukakuPlayer({ client: this.client, shoukaku: this, shoukakuNode: node });
            this.pending.set(guildID, player);
            let timeout;
            let handle;
            let error;
            handle = () => {
                player.off('serverUpdateFailed', error);
                this.pending.delete(guildID);
                this.client.clearTimeout(timeout);
                this.players.set(guildID, player);
                resolve(player);
            };
            error = (error) => {
                player.off('serverUpdate', handle);
                this.pending.delete(guildID);
                this.client.clearTimeout(timeout);
                reject(error);
            };
            timeout = this.client.setTimeout(() => {
                player.off('serverUpdate', handle);
                player.off('serverUpdateFailed', error);
                this.pending.delete(guildID);
                reject(new Error('Failed to join the voice channel in 15 seconds'));
            }, 15000);
            player.once('serverUpdate', handle);
            player.once('serverUpdateFailed', error);
            const sent = this._send({
                op: 4,
                d: {
                    guild_id: guildID,
                    channel_id: channelID,
                    self_mute: selfMute,
                    self_deaf: selfDeaf
                }
            });
            if (!sent) {
                this.client.clearTimeout(timeout);
                player.off('serverUpdate', handle);
                player.off('serverUpdateFailed', error);
                this.pending.delete(guildID);
                reject(new Error('The GuildID provided is not in this shard.'));
            }
        });
    }

    async leave(guildID) {
        const player = this.players.get(guildID);
        if (!player) return;
        player.removeAllListeners();
        await player.destroy().catch(() => null);
        this._send({
            op: 4,
            d: {
                guild_id: guildID,
                channel_id: null,
                self_mute: false,
                self_deaf: false
            }
        });
    }

    // Based on https://github.com/discordjs/discord.js/blob/master/src/util/Util.js#L139
    _mergeDefault(def, given) {
        if (!given) return def;
        const defaultKeys = Object.keys(def);
        for (const key of defaultKeys) {
            if (def[key] === null) {
                if (!given[key]) throw new Error(`${key} was not found and the given options.`);
            }
            if (!given[key]) given[key] = def[key];
        }
        for (const key in defaultKeys) {
            if (defaultKeys.includes(key)) continue;
            delete given[key];
        }
        return given;
    }

    _message(parsed) {
        if (!parsed || !parsed.op) return;
        const player = this.players.get(parsed.guildId);
        if (!player) return;
        player._message(parsed);
    }

    _disconnect(reason, host) {
        this.removeShoukakuNode(host);
        this.emit('nodeDisconnect', reason, host);
    }

    _update(p) {
        if (!this.client.guilds.has(p.d.guild_id)) return;
        const player = this.pending.get(p.d.guild_id) || this.players.get(p.d.guild_id);
        if (!player) return;
        if (p.t === 'VOICE_STATE_UPDATE') {
            if (p.d.user_id !== this.id) return;
            return player._setData(p.d);
        }
        player._serverUpdate(p.d);
    }

    _send(p) {
        const guild = this.client.guilds.get(p.d.guild_id);
        if (!guild) return false;
        guild.shard.send(p);
        return true;
    }
}

module.exports = Shoukaku;