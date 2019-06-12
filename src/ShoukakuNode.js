const EventEmitter = require('events');
const Websocket = require('ws');
const Status = {
    0: 'Ready',
    1: 'Connected',
    2: 'Connecting',
    3: 'Reconnecting',
    4: 'Disconnected' 
};

class ShoukakuNode extends EventEmitter {
    constructor(Shoukaku, options, node) {
        super();
        
        Object.defineProperty(this, 'Shoukaku', { value: Shoukaku });
        Object.defineProperty(this, 'host', { value: node.host });
        Object.defineProperty(this, 'port', { value: node.port });
        Object.defineProperty(this, 'auth', { value: node.auth });
        Object.defineProperty(this, 'resumable', { value: options.resumable || false });
        Object.defineProperty(this, 'resumableTimeout', { value: options.resumableTimeout || 30 });
        Object.defineProperty(this, 'resumekey', { value: options.resumekey || 'resumable'});

        this.url = `ws://${node.host}:${node.port}`;
        this.reconnectInterval = options.reconnectInterval || 10000;
        this.reconnectTries = options.reconnectTries || 2;

        this.actualTries = 0;
        this.status = 4;
        this.ws = null;
    }

    get nodeStatus() {
        return Status[this.status];
    }

    connect() {
        if (this.nodeStatus !== 'Reconnecting') this.status = 2;
        const headers = {
            'Authorization': this.auth,
            'User-Id': this.Shoukaku.id,
            'Num-Shards': this.Shoukaku.shardCount
        };
        if (this.resumable && this.nodeStatus === 'Ready') headers['Resume-key'] = this.resumekey;
        this.ws = new Websocket(this.url, { headers });
        this.ws.on('upgrade', this._upgrade.bind(this));
        this.ws.on('open', this._open.bind(this));
        this.ws.on('message', this._message.bind(this));
        this.ws.on('error', this._error.bind(this));
        this.ws.on('close', this._close.bind(this));
    }

    disconnect() {
        if (!this.ws) return;
        this.ws.close(1000, 'User Invoked Disconnection');
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

    reconnect() {
        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws = null;
        }
        if (this.actualTries >= this.reconnectTries) {
            this.status = 4;
            return this.emit('disconnect', `Retried ${this.actualTries} already but ws didn't connect.`, this.host);
        }
        setTimeout(() => {
            this.status = 3;
            try {
                this.emit('reconnecting', this.host);
                this.actualTries++;
                this.connect();
            } catch (error) {
                this.emit('error', error, this.host);
                this.reconnect();
            }
        }, this.reconnectInterval);
    }

    _upgrade(data) {
        if (data.headers['session-resumed'] === 'true') this.emit('resumed', this.host);
        if (data.headers['session-resumed'] === 'false' && this.nodeStatus === 'Reconnecting') this.emit('newSession', this.host);
    }

    async _open() {
        try {
            if (this.nodeStatus === 'Reconnecting') this.status = 1;
            if (this.resumable) {
                await this.send({
                    op: 'configureResuming',
                    key: this.resumekey,
                    timeout: this.resumableTimeout
                });
            }
            this.status = 0;
            this.actualTries = 0;
            this.emit('ready', this.host);
        } catch (error) {
            this.emit('error', error, this.host);
            if (this.ws && this.ws.readyState <= 2) this.ws.close(1011, 'Node onOpen errored, reconnecting the Websocket');
        }
    }

    _message(data) {
        try {
            const parsed = JSON.parse(data);
            if (data.op === 'stats') 
                return this.emit('stats', parsed, this.host);
            this.emit('message', parsed, this.host);
        } catch (error) {
            this.emit('error', error, this.host);
        }
    }

    _error(error) {
        this.emit('error', error, this.host);
        this.ws.close(1011, 'Node Errored, Reconnecting the websocket');
    }

    _close(code, reason) {
        this.ws.removeAllListeners();
        this.ws = null;
        this.status = 4;
        if (code === 1000) return this.emit('disconnect', reason, this.host);
        this.reconnect();
    }
}

module.exports = ShoukakuNode;