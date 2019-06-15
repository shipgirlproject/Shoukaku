const EventEmitter = require('events');
const { ShoukakuPlayOptions } = require('./ShoukakuConstants.js');

class ShoukakuPlayer extends EventEmitter {
    constructor(link) {
        super();

        this.link = link;
        this.track = null;
        this.paused = false;
        this.volume = 100;
        this.position = 0;

        this.on('end', () => this._clearTrack());
        this.on('stuck', () => this._clearTrack());
        this.on('voiceClose', () => this._clearTrack());
    }

    async playTrack(track, options = ShoukakuPlayOptions) {
        if (!track) return false;
        const payload = {};
        Object.defineProperty(payload, 'op', { value: 'play', enumerable: true });
        Object.defineProperty(payload, 'guildId', { value: this.link.guildID, enumerable: true });
        Object.defineProperty(payload, 'track', { value: track, enumerable: true });
        Object.defineProperty(payload, 'noReplace', { value: true, enumerable: true });
        if (options.startTime) Object.defineProperty(payload, 'startTime', { value: options.startTime, enumerable: true });
        if (options.endTime) Object.defineProperty(payload, 'endTime', { value: options.endTime, enumerable: true });
        await this.link.node.send(payload);
        this.track = track;
        return true;
    }

    async stopTrack() {
        this.track = null;
        this.position = 0;
        await this.link.node.send({
            op: 'stop',
            guildId: this.link.guildID
        });
        return true;
    }

    async setPaused(pause) {
        if (!pause || pause === this.paused) return false;
        await this.link.node.send({
            op: 'pause',
            guildId: this.link.guildID,
            pause
        });
        this.pause = pause;
        return true;
    }

    async setEqualizer(bands) {
        if (!bands || !Array.isArray(bands)) return false;
        await this.link.node.send({
            op: 'equalizer',
            guildId: this.link.guildID,
            bands
        });
        return true;    
    }

    async setVolume(volume) {
        if (!volume) return false;
        volume = Math.min(1000, Math.max(0, volume));
        await this.link.node.send({
            op: 'volume',
            guildId: this.link.guildID,
            volume
        });
        this.volume = volume;
        return true;
    }   

    _clearTrack() {
        this.track = null;
        this.position = 0;
    }

    _playerUpdate(state) {
        this.position = state.position;
        return this.emit('playerUpdate', state);
    }

    _onNodeChange() {
        if (!this.track) return;
        this.playTrack(this.track, { startTime: this.position }).catch(() => null);
    }
}
module.exports = ShoukakuPlayer;