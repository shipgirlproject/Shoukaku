const EventEmitter = require('events');

class ShoukakuPlayer extends EventEmitter {
    constructor(origin) {
        super();

        Object.defineProperty(this, 'client', { value: origin.client });
        Object.defineProperty(this, 'Shoukaku', { value: origin.shoukaku });
        Object.defineProperty(this, 'ShoukakuNode', { value: origin.shoukakuNode, writable: true });

        this.id = null;
        this.channel = null;
        this.selfDeaf = false;
        this.selfMute = false;
        Object.defineProperty(this, 'sessionID', { value: null, writable: true });
        Object.defineProperty(this, 'serverUpdate', { value: null, writable: true });

        this.playing = false;
        this.paused = false;
        this.should = true;
    }

    get handleDisconnects() {
        return this.Shoukaku.options.handleNodeDisconnects;
    }

    async play(track) {
        await this.ShoukakuNode.send({
            op: 'play',
            guildId: this.id,
            track
        });
        this.playing = true;
        return this;
    }

    async volume(volume) {
        await this.ShoukakuNode.send({
            op: 'volume',
            guildId: this.id,
            volume
        });
        return this;
    }

    async setBands(bands) {
        await this.ShoukakuNode.send({
            op: 'equalizer',
            guildId: this.id,
            bands
        });
        return this;
    }

    async pause(pause = true) {
        await this.ShoukakuNode.send({
            op: 'pause',
            guildId: this.id,
            pause
        });
        this.paused = pause;
        return this;
    }    
    
    async seek(time) {
        await this.ShoukakuNode.send({
            op: 'seek',
            guildId: this.id,
            position: time
        });
        return this;
    }

    async stop() {
        await this.ShoukakuNode.send({
            op: 'stop',
            guildId: this.id
        });
        this.playing = false;
        return this;
    }

    async destroy() {
        await this.ShoukakuNode.send({
            op: 'destroy',
            guildId: this.id
        });
        this.playing = false;
        return this;
    }

    moveShoukakuNode(host, track, startTime) {
        return new Promise((resolve, reject) => {
            if (!this.Shoukaku.nodes.has(host))
                return reject(new Error(`Host ${host} is not one of my host(s)`));
            const ShoukakuNode = this.Shoukaku.nodes.get(host);
            ShoukakuNode.send({
                op: 'voiceUpdate',
                guildId: this.id,
                sessionId: this.sessionID,
                event: this.serverUpdate
            }).then(() => {
                ShoukakuNode.send({
                    op: 'play',
                    guildId: this.id,
                    track,
                    startTime
                }).then(() => {
                    this.playing = true;
                    this.ShoukakuNode = ShoukakuNode;
                    resolve(this);
                }, (error) => reject(error));
            }, (error) => reject(error));
        });
    }

    _message(parsed) {
        if (parsed.op === 'playerUpdate') {
            if (!this.should) return;
            this.should = false;
            setTimeout(() => this.should = true, 500);
            return this.emit('playerUpdate', parsed.state);
        }
        if (parsed.type === 'TrackEndEvent' || parsed.type === 'TrackStuckEvent') {
            if (parsed.reason !== 'REPLACED') this.playing = false;
            return this.emit('playerEnd', parsed);
        }
        if (parsed.type === 'TrackExceptionEvent') {
            this.playing = false;
            return this.emit('playerError', parsed);
        }
        if (parsed.type === 'WebSocketClosedEvent') {
            this.playing = false;
            return this.emit('playerClosed', parsed);
        }
        this.emit('playerWarn', `Unknown Event: ${parsed.type}`);
    }

    _removedNode() {
        if (this.handleDisconnects) {
            this.removeAllListeners();
            this.Shoukaku.players.delete(this.id);
            return this.emit('playerNodeClosed');
        }
        this.emit('playerNodeClosed');
    }

    async _serverUpdate(event) {
        try {
            if (!this.sessionID)
                throw new Error('ShoukakuPlayer sessionID not found');
            await this.ShoukakuNode.send({
                op: 'voiceUpdate',
                guildId: this.id,
                sessionId: this.sessionID,
                event
            });
            this.serverUpdate = event;
            this.emit('serverUpdate');
        } catch (error) {
            if (this.listenerCount('serverUpdateFailed')) this.emit('serverUpdateFailed', error);
        }
    }

    _setData(d) {
        this.id = d.guild_id;
        this.channel_id = d.channel_id;
        this.selfDeaf = d.self_deaf;
        this.selfMute = d.self_mute;
        this.sessionID = d.session_id;
    }
}
module.exports = ShoukakuPlayer;