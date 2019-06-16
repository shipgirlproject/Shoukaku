const EventEmitter = require('events');
const { ShoukakuPlayOptions } = require('./ShoukakuConstants.js');
class ShoukakuPlayer extends EventEmitter {
    /**
     * ShoukakuPlayer, Governs the playing stuff on your guild
     * @extends {external:EventEmitter}
     * @param  {ShoukakuLink} link The Link in which this player is connected to.
     */
    constructor(link) {
        super();
        /**
         * The Link where this connected to.
         * @type {ShoukakuLink}
         */
        this.link = link;
        /**
         * The Track that is currently being played by this player.
         * @type {base64}
         */
        this.track = null;
        /**
         * If this player is currently paused.
         * @type {boolean}
         */
        this.paused = false;
        /**
         * The current volume of this player
         * @type {number}
         */
        this.volume = 100;
        /**
         * The current postion in ms of this player
         * @type {number}
         */
        this.position = 0;

        this.on('end', () => this._clearTrack());
        this.on('stuck', () => this._clearTrack());
        this.on('voiceClose', () => this._clearTrack());
        this.on('playerUpdate', (state) => this.position = state.position);
    }

    // Events
    /**
     * Emitted when the Lavalink Player emits a TrackEnd event.
     * @event ShoukakuPlayer#end
     * @param {Object} reason
     */
    /**
     * Emitted when the Lavalink Player encounters an TrackException event. This is just a normal object that contains the error. Not an error object.
     * @event ShoukakuPlayer#exception
     * @param {Object} reason
     */
    /**
     * Emitted when the Lavalink Player encounters an TrackStuck event. When this fires, TrackEnd will not fire, so make sure you handle this as well.
     * @event ShoukakuPlayer#stuck
     * @param {Object} reason
     */
    /**
     * Emitted when the Client's Voice Connection got closed by Discord and not by you.
     * @event ShoukakuPlayer#voiceClose
     * @param {Object} reason
     */
    /**
     * Emitted when Lavalink gives a Player Update event.
     * @event ShoukakuPlayer#playerUpdate
     * @param {Object} data
     */
    // Events End

    /**
     * Plays the track you specifed. Warning: If the player is playing anything, calling this will just ignore your call. Call `ShoukakuPlayer.StopTrack()` first.
     * @param {base64} track The Base64 encoded track you got from lavalink API.
     * @param {ShoukakuConstants#ShoukakuPlayOptions} [options=ShoukakuPlayOptions] Used if you want to put a custom track start or end time.
     * @returns {Promise<boolean>} true if sucessful false if not.
     */
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
    /**
     * Stops the player from playing.
     * @returns {Promise<boolean>} true if sucessful false if not.
     */
    async stopTrack() {
        this.track = null;
        this.position = 0;
        await this.link.node.send({
            op: 'stop',
            guildId: this.link.guildID
        });
        return true;
    }
    /**
     * Pauses / Unpauses the player
     * @param {boolean} [pause=true] true to pause, false to unpause
     * @returns {Promise<boolean>} true if sucessful false if not.
     */
    async setPaused(pause = true) {
        if (!pause || pause === this.paused) return false;
        await this.link.node.send({
            op: 'pause',
            guildId: this.link.guildID,
            pause
        });
        this.pause = pause;
        return true;
    }
    /**
     * Sets the equalizer of your lavalink player
     * @param {Array} bands An array of Lavalink bands.
     * @returns {Promise<boolean>} true if sucessful false if not.
     */
    async setEqualizer(bands) {
        if (!bands || !Array.isArray(bands)) return false;
        await this.link.node.send({
            op: 'equalizer',
            guildId: this.link.guildID,
            bands
        });
        return true;
    }
    /**
     * Sets the playback volume of your lavalink player
     * @param {number} volume The new volume you want to set on the player.
     * @returns {Promise<boolean>} true if sucessful false if not.
     */
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
    /**
     * Seeks your player to the time you want
     * @param {number} position position in MS you want to seek to.
     * @returns {Promise<boolean>} true if sucessful false if not.
     */
    async seekTo(position) {
        if (!position) return false;
        await this.link.node.send({
            op: 'seek',
            guildId: this.link.guildID,
            position
        });
        return true;
    }

    _clearTrack() {
        this.track = null;
        this.position = 0;
    }

    _onNodeChange() {
        if (!this.track) return;
        this.playTrack(this.track, { startTime: this.position }).catch(() => null);
    }
}
module.exports = ShoukakuPlayer;
