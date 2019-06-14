const { SHOUKAKU_STATUS, SHOUKAKU_NODE_STATS, ShoukakuJoinOptions } = require('./ShoukakuConstants.js');
const ShoukakuResolver = require('./ShoukakuResolver.js');
const ShoukakuLink = require('./ShoukakuLink.js');
const Websocket = require('ws');
const EventEmitter = require('events');

class ShoukakuSocket extends EventEmitter {
    constructor(shoukaku, node) {
        super();

        this.shoukaku = shoukaku;
        this.name = node.name;
        this.resumableTimeout = shoukaku.options.resumableTimeout;
        this.state = SHOUKAKU_STATUS.DISCONNECTED;
        this.stats = SHOUKAKU_NODE_STATS;
        this.reconnectAttempts = 0;
        this.links = new Map();
        this.rest = new ShoukakuResolver(node.host, node.port, node.auth,shoukaku.options.restTimeout);
        Object.defineProperty(this, 'url', { value: `ws://${node.host}:${node.port}` });
        Object.defineProperty(this, 'auth', { value: node.auth });
        Object.defineProperty(this, 'resumed', { value: false, writable: true });
    }

    get penalties() {
        const penalties = 0;
        penalties.points += this.stats.players;
        penalties.points += Math.round(Math.pow(1.05, 100 * this.stats.cpu.systemLoad) * 10 - 10);
        penalties.points += this.stats.frameStats.deficit;
        penalties.points += this.stats.frameStats.nulled * 2;
        return penalties;
    }

    connect(id, shardCount, resumable) {
        const headers = {};
        Object.defineProperty(headers, 'Authorization', { value: this.auth });
        Object.defineProperty(headers, 'Num-Shards', { value: id });
        Object.defineProperty(headers, 'User-Id', { value: shardCount });
        if (resumable) Object.defineProperty(headers, 'Resume-Key', { value: resumable });
        this.ws = new Websocket(this.url, { headers });
        this.ws.on('upgrade', this._upgrade.bind(this));
        this.ws.on('open', this._open.bind(this));
        this.ws.on('message', this._message.bind(this));
        this.ws.on('error', this._error.bind(this));
        this.shoukaku.on('packetUpdate', this._handle_update.bind(this));
    }

    reconnect() {
        this.reconnectAttempts++;
        this.connect();
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

    handleEvent(json) {
        const link = this.links.get(json.guildId);
        if (!link) return false;
        if (json.op  === 'playerUpdate') return link.player._playerUpdate(json.state);
        if (json.op === 'event') {
            if (json.type === 'TrackEndEvent') return link.player.emit('TrackEnd');
            if (json.type === 'TrackExceptionEvent') return link.player.emit('TrackException');
            if (json.type === 'TrackStuckEvent') return link.player.emit('TrackStuck');
            if (json.type === 'WebSocketClosedEvent') return link.player.emit('WebSocketClosed');
        }
    }

    joinVoiceChannel(options = ShoukakuJoinOptions) {
        return new Promise((resolve, reject) => {
            if (!options.guild_id || !options.channel_id)
                return reject(new Error('Guild ID or Channel ID is not specified.'));
            const link = this.links.get(options.guild_id);
            if (link)
                return reject(new Error('A voice connection is already established in this channel.'));
            const newLink = new ShoukakuLink(this);
            this.links.set(options.guild_id, newLink);
            const timeout = setTimeout(() => {
                this.links.delete(options.guild_id);
                reject(new Error('The voice connection is not established in 15 seconds'));
            }, 15000);
            newLink.join(options, (error, value) => {
                clearTimeout(timeout);
                if (error) {
                    this.links.delete(options.guild_id);
                    return reject(error);
                }
                resolve(value);
            });
        });
    }

    _handle_update(packet) {
        const link = this.links.get(packet.d.guild_id);
        if (!link) return;
        if (packet.t === 'VOICE_STATE_UPDATE') link.build(packet.d);
        if (packet.t === 'VOICE_SERVER_UPDATE') link.serverUpdate(packet);
    }

    _configureResuming() {
        return this.send({
            op: 'configureResuming',
            key: this.resumable,
            timeout: this.resumableTimeout
        });
    }

    _upgrade(response) {
        this._configureResuming()
            .then(() =>{
                this.resumed = response.headers['session-resumed'] === 'true';
            })            
            .catch((error) => this.emit('error', this.name, error));
    }

    _open() {
        this.reconnectAttempts = 0;
        this.state = SHOUKAKU_STATUS.CONNECTED;
        this.emit('ready', this.name, this.resumed);
    }

    _message(message) {
        try {
            const json = JSON.parse(message);
            if (json.op !== 'playerUpdate') this.emit('debug', json, this.name);
            if (json.op === 'stats') return this.stats = json;
            this.handleEvent(json);
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
        this.shoukaku.removeListener('packetUpdate', this._handle_update.bind(this));
        this.ws = null;
        this.emit('close', this.name, code, reason);
    }
}
module.exports = ShoukakuSocket;