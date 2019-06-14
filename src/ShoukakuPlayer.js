const EventEmitter = require('events');

class ShoukakuPlayer extends EventEmitter {
    constructor(link) {
        super();

        this.link = link;
        this.track = null;
        this.paused = false;
        this.volume = 100;
        this.position = 0;
    }

    async playTrack(track, { startTime, endTime }) {
        if (!track) return false;
        const payload = {};
        Object.defineProperty(payload, 'op', { value: 'play' });
        Object.defineProperty(payload, 'guildId', { value: this.link.guildID });
        Object.defineProperty(payload, 'track', { value: track });
        if (startTime) Object.defineProperty(payload, 'startTime', { value: track });
        if (endTime) Object.defineProperty(payload, 'endTime', { value: track });
        await this.link.send(payload);
        this.track = track;
        return true;
    }

    async stopTrack() {
        this.track = null;
        this.position = 0;
        await this.link.send({
            op: 'stop',
            guildId: this.link.guildID
        });
        return true;
    }

    async setPaused(pause) {
        if (!pause || pause === this.paused) return false;
        await this.link.send({
            op: 'pause',
            guildId: this.link.guildID,
            pause
        });
        this.pause = pause;
        return true;
    }

    async setEqualizer(bands) {
        if (!bands || !Array.isArray(bands)) return false;
        await this.link.send({
            op: 'equalizer',
            guildId: this.link.guildID,
            bands
        });
        return true;    
    }

    async setVolume(volume) {
        if (!volume) return false;
        volume = Math.min(1000, Math.max(0, volume));
        await this.link.send({
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