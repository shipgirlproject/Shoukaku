const EventEmitter = require('events');

class ShoukakuPlayer extends EventEmitter {
    constructor(origin) {
        super();

        Object.defineProperty(this, 'client', { value: origin.client });
        Object.defineProperty(this, 'shoukaku', { value: origin.shoukaku });
        Object.defineProperty(this, 'shoukakuNode', { value: origin.shoukakuNode });
        Object.defineProperty(this, 'sessionID', { value: null, writable: true });
        
        this.id = null;
        this.channel = null;
        this.selfDeaf = false;
        this.selfMute = false;

        this.playing = false;
        this.paused = false;
        this.should = true;
    }

    async play(track) {
        await this.shoukakuNode.send({
            op: 'play',
            guildId: this.id,
            track
        });
        this.playing = true;
        return this;
    }

    async setBands(bands) {
        await this.shoukakuNode.send({
            op: 'equalizer',
            guildId: this.id,
            bands
        });
        return this;
    }

    async pause(pause = true) {
        await this.shoukakuNode.send({
            op: 'pause',
            guildId: this.id,
            pause
        });
        this.paused = pause;
        return this;
    }

    async stop() {
        await this.shoukakuNode.send({
            op: 'stop',
            guildId: this.id
        });
        this.playing = false;
        return this;
    }

    async seek(time) {
        await this.shoukakuNode.send({
            op: 'seek',
            guildId: this.id,
            position: time
        });
        return this;
    }

    async destroy() {
        await this.shoukakuNode.send({
            op: 'destroy',
            guildId: this.id
        });
        this.playing = false;
        return this;
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
        this.emit('playerNodeClosed');
    }

    async _serverUpdate(event) {
        try {
            if (!this.sessionID)
                throw new Error('ShoukakuPlayer sessionID not found');
            await this.shoukakuNode.send({
                op: 'voiceUpdate',
                guildId: this.id,
                sessionId: this.sessionID,
                event
            });
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