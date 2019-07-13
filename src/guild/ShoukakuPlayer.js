const EventEmitter = require('events');
const { ShoukakuPlayOptions } = require('../constants/ShoukakuConstants.js');
const ShoukakuLink = require('./ShoukakuLink.js');
const endEvents = ['end', 'closed', 'error', 'trackException', 'nodeDisconnect'];

class ShoukakuPlayer extends EventEmitter {
    /**
     * ShoukakuPlayer, Governs the playing stuff on your guild
     * @extends {external:EventEmitter}
     * @param  {ShoukakuSocket} node The node that governs this player.
     * @param  {external:Guild} guild A Discord.JS Guild Object.
     */
    constructor(node, guild) {
        super();
        /**
         * The Link where this connected to.
         * @type {ShoukakuLink}
         */
        this.voiceConnection = new ShoukakuLink(this, node, guild);
        /**
         * The Track that is currently being played by this player.
         * @type {?string}
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
         * The current equalizer bands set in this player.
         * @type {Array}
         */
        this.bands = [];
        /**
         * The current postion in ms of this player
         * @type {number}
         */
        this.position = 0;
    }

    // Events
    /**
     * Emitted when the Lavalink Player emits a TrackEnd or TrackStuck event.
     * @event ShoukakuPlayer#end
     * @param {Object} reason
     */
    /**
     * Emitted when the voiceConnection got closed.
     * @event ShoukakuPlayer#closed
     * @param {Object} reason
     * @example
     * // <Player> is your ShoukakuPlayer instance
     * <Player>.on('closed', (reason) => {
     *   <Player>.disconnect();
     * })
     */
    /**
     * Emitted when this library encounters an error in ShoukakuPlayer or ShoukakuLink class. MUST BE HANDLED.
     * @event ShoukakuPlayer#error
     * @param {Error} error The error encountered.
     * @example
     * // <Player> is your ShoukakuPlayer instance
     * <Player>.on('error', (error) => {
     *   console.error(error);
     *   <Player>.disconnect();
     * })
     */
    /**
     * Emitted when this player's node was disconnected. MUST BE HANDLED.
     * @event ShoukakuPlayer#nodeDisconnect
     * @param {string} name The name of the node that disconnected.
     * @example
     * // <Player> is your ShoukakuPlayer instance
     * <Player>.on('nodeDisconnect', (name) => {
     *   console.log(`Node ${name} which governs this player disconnected.`);
     *   <Player>.disconnect();
     * })
     */
    /**
     * Emitted when Lavalink encounters an error on playing the song. Optional.
     * @event ShoukakuPlayer#trackException
     * @param {Object} reason
     */
    /**
     * Emitted when the Shoukaku Player resumes the session by resending the playing data. Optional.
     * @event ShoukakuPlayer#resumed
     */
    /**
     * Emitted when Lavalink gives a Player Update event. Optional.
     * @event ShoukakuPlayer#playerUpdate
     * @param {Object} data
     */
    // Events End

    /**
     * Generates a VoiceConnection to the Guild's specific Voice Channel. Warning: DO NOT USE THIS UNLESS YOU HAVE A GOOD REASON TO DO SO. Use `node.joinVoiceChannel()` instead.
     * @param {Object} options The Join Object Format from Discord API Documentation
     * @param {function(error, ShoukakuLink):void} callback The callback to run.
     * @returns {void}
     */
    connect(options, callback) {
        this.voiceConnection._connect(options, callback);
    }
    /**
     * Eventually Disconnects the VoiceConnection from a Guild. Could be also used to clean up player remnants from unexpected events.
     * @returns {void}
     */
    disconnect() {
        this.voiceConnection._disconnect();
    }

    /**
     * Plays the track you specifed. Warning: If the player is playing anything, calling this will just ignore your call. Call `ShoukakuPlayer.StopTrack()` first.
     * @param {string} track The Base64 encoded track you got from lavalink API.
     * @param {ShoukakuConstants#ShoukakuPlayOptions} [options=ShoukakuPlayOptions] Used if you want to put a custom track start or end time.
     * @returns {Promise<boolean>} true if successful false if not.
     */
    async playTrack(track, options = ShoukakuPlayOptions) {
        if (!track) return false;
        const payload = {};
        Object.defineProperty(payload, 'op', { value: 'play', enumerable: true });
        Object.defineProperty(payload, 'guildId', { value: this.voiceConnection.guildID, enumerable: true });
        Object.defineProperty(payload, 'track', { value: track, enumerable: true });
        Object.defineProperty(payload, 'noReplace', { value: true, enumerable: true });
        if (options.startTime) Object.defineProperty(payload, 'startTime', { value: options.startTime, enumerable: true });
        if (options.endTime) Object.defineProperty(payload, 'endTime', { value: options.endTime, enumerable: true });
        await this.voiceConnection.node.send(payload);
        this.track = track;
        return true;
    }
    /**
     * Stops the player from playing.
     * @returns {Promise<boolean>} true if successful false if not.
     */
    async stopTrack() {
        this.track = null;
        this.position = 0;
        await this.voiceConnection.node.send({
            op: 'stop',
            guildId: this.voiceConnection.guildID
        });
        return true;
    }
    /**
     * Pauses / Unpauses the player
     * @param {boolean} [pause=true] true to pause, false to unpause
     * @returns {Promise<boolean>} true if successful false if not.
     */
    async setPaused(pause = true) {
        if (pause === this.paused) return false;
        await this.voiceConnection.node.send({
            op: 'pause',
            guildId: this.voiceConnection.guildID,
            pause
        });
        this.paused = pause;
        return true;
    }
    /**
     * Sets the equalizer of your lavalink player
     * @param {Array} bands An array of Lavalink bands.
     * @returns {Promise<boolean>} true if successful false if not.
     */
    async setEqualizer(bands) {
        if (!bands || !Array.isArray(bands)) return false;
        this.bands = bands;
        await this.voiceConnection.node.send({
            op: 'equalizer',
            guildId: this.voiceConnection.guildID,
            bands
        });
        return true;
    }
    /**
     * Sets the playback volume of your lavalink player
     * @param {number} volume The new volume you want to set on the player.
     * @returns {Promise<boolean>} true if successful false if not.
     */
    async setVolume(volume) {
        if (!volume) return false;
        volume = Math.min(1000, Math.max(0, volume));
        await this.voiceConnection.node.send({
            op: 'volume',
            guildId: this.voiceConnection.guildID,
            volume
        });
        this.volume = volume;
        return true;
    }
    /**
     * Seeks your player to the time you want
     * @param {number} position position in MS you want to seek to.
     * @returns {Promise<boolean>} true if successful false if not.
     */
    async seekTo(position) {
        if (!position) return false;
        await this.voiceConnection.node.send({
            op: 'seek',
            guildId: this.voiceConnection.guildID,
            position
        });
        return true;
    }

    _listen(event, data) {
        if (endEvents.includes(event)) {
            event === 'nodeDisconnect' ? this._clearTrack() && this._clearPlayer() : this._clearTrack();
            this.emit(event, data);
            return;
        }
        if (data) this.position = data.position;
        this.emit(event, data);
    }

    _clearTrack() {
        this.track = null;
        this.position = 0;
    }

    _clearPlayer() {
        this.bands = null;
    }

    async _resume() {
        if (!this.track) {
            this._listen('error', new Error('No Track Found upon trying to resume.'));
            return;
        }
        try {
            await this.playTrack(this.track.repeat(1), { startTime: this.position });
            if (this.bands.length) await this.setEqualizer(this.bands.slice(0));
            if (this.volume !== 100) await this.setVolume(Number(this.volume));
            this._listen('resumed', null);
        } catch (error) {
            this._listen('error', error);
        }
    }
}
module.exports = ShoukakuPlayer;
