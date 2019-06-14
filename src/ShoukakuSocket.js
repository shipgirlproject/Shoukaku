const constants = require('./ShoukakuConstants.js');
const ShoukakuResolver = require('./ShoukakuResolver.js');
const Websocket = require('ws');
const EventEmitter = require('events');

class ShoukakuSocket extends EventEmitter {
    constructor(node, options) {
        super();

        this.name = node.name;
        this.resumableTimeout = options.resumableTimeout;
        this.state = constants.SHOUKAKU_STATUS.DISCONNECTED;
        this.stats = constants.SHOUKAKU_NODE_STATS;
        this.reconnectAttempts = 0;
        this.links = new Map();
        this.rest = new ShoukakuResolver(node.host, node.port, node.auth, options.restTimeout);
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
        this.state = constants.SHOUKAKU_STATUS.CONNECTED;
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
        this.ws = null;
        this.emit('close', this.name, code, reason);
    }
}
module.exports = ShoukakuSocket;