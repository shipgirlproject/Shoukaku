const EventEmitter = require('events');
const { ShoukakuPlayOptions, ShoukakuStatus } = require('../constants/ShoukakuConstants.js');
const ShoukakuLink = require('./ShoukakuLink.js');
const ShoukakuError = require('../constants/ShoukakuError.js');
const endEvents = ['end', 'closed', 'error', 'trackException', 'nodeDisconnect'];

/**
 * ShoukakuPlayer, used to control the player on the guildused to control the player on the guild.
 * @class ShoukakuPlayer
 * @extends {external:EventEmitter}
 */
class ShoukakuPlayer extends EventEmitter {
    /**
     * @param  {ShoukakuSocket} node The node that governs this player.
     * @param  {external:Guild} guild A Discord.JS Guild Object.
     */
    constructor(node, guild) {
        super();
        /**
         * The Voice Connection of this Player.
         * @type {ShoukakuLink}
         */
        this.voiceConnection = new ShoukakuLink(node, this, guild);
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

        this.bassboost = false;
        this.vaporwave  = false;
        this.nightcore = 1.0;
        this.karaoke = false;
    }

    /**
     * Emitted when the Lavalink Player emits a TrackEnd or TrackStuck event.
     * @event ShoukakuPlayer#end
     * @param {Object} reason
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when the voiceConnection got closed.
     * @event ShoukakuPlayer#closed
     * @param {Object} reason
     * @memberOf ShoukakuPlayer
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
     * @memberOf ShoukakuPlayer
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
     * @memberOf ShoukakuPlayer
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
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when the Shoukaku Player resumes the session by resending the playing data. Optional.
     * @event ShoukakuPlayer#resumed
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when Lavalink gives a Player Update event. Optional.
     * @event ShoukakuPlayer#playerUpdate
     * @param {Object} data
     * @memberOf ShoukakuPlayer
     */

    /**
     * Eventually Connects the Bot to the voice channel in the guild. This is used internally and must not be used to connect players. Use `<ShoukakuSocket>.joinVoiceChannel()` instead.
     * @memberOf ShoukakuPlayer
     * @returns {void}
     */
    connect(options, callback) {
        this.voiceConnection._connect(options, callback);
    }
    /**
     * Eventually Disconnects the VoiceConnection & Removes the player from a Guild. Could be also used to clean up player remnants from unexpected events.
     * @memberOf ShoukakuPlayer
     * @returns {void}
     */
    disconnect() {
        this.voiceConnection._disconnect();
    }
    /**
     * Moves this Player & VoiceConnection to another lavalink node you specified.
     * @param {string} name Name of the Node you want to move to.
     * @memberOf ShoukakuPlayer
     * @returns {Promise<void>}
     */
    async moveToNode(name) {
        const node = this.voiceConnection.node.shoukaku.nodes.get(name);
        if (!node || node.name === this.voiceConnection.node.name) return;
        if (node.state !== ShoukakuStatus.CONNECTED)
            throw new Error('The node you specified is not ready.');
        await this.voiceConnection._move(node);
    }
    /**
     * Plays the track you specifed. Warning: If the player is playing anything, calling this will just ignore your call. Call `ShoukakuPlayer.StopTrack()` first.
     * @param {string} track The Base64 encoded track you got from lavalink API.
     * @param {ShoukakuConstants#ShoukakuPlayOptions} [options=ShoukakuPlayOptions] Used if you want to put a custom track start or end time.
     * @memberOf ShoukakuPlayer
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
        if (track !== this.track) this.track = track;
        return true;
    }
    /**
     * Stops the player from playing.
     * @memberOf ShoukakuPlayer
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
     * @memberOf ShoukakuPlayer
     * @returns {Promise<boolean>} true if successful false if not.
     */
    async setPaused(pause = true) {
        if (pause === this.paused) return false;
        await this.voiceConnection.node.send({
            op: 'pause',
            guildId: this.voiceConnection.guildID,
            pause
        });
        if (pause !== this.paused) this.paused = pause;
        return true;
    }
    /**
     * Sets the equalizer of your lavalink player
     * @param {Array} bands An array of Lavalink bands.
     * @memberOf ShoukakuPlayer
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
        this.bands = JSON.parse(JSON.stringify(bands));
        this.bassboost = false;
        return true;
    }
    /**
     * Sets the playback volume of your lavalink player
     * @param {number} volume The new volume you want to set on the player.
     * @memberOf ShoukakuPlayer
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
        if (volume !== this.volume) this.volume = volume;
        return true;
    }
    /**
     * Seeks your player to the time you want
     * @param {number} position position in MS you want to seek to.
     * @memberOf ShoukakuPlayer
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

    async setNightcore(speed, hq = false) {
        if (!speed) return false;
        await this.voiceConnection.node.send({
            op: 'nightcore',
            guildId: this.voiceConnection.guildID,
            speed,
            hq
        });
        if (speed !== this.nightcore) this.nightcore = speed;
        return true;
    }

    async setKaraoke(enabled = false) {
        await this.voiceConnection.node.send({
            op: 'karaoke',
            guildId: this.voiceConnection.guildID,
            enabled
        });
        if (enabled !== this.karaoke) this.karaoke = enabled;
        return true;
    }

    async setBassBoost(enabled = false) {
        await this.voiceConnection.node.send({
            op: 'bassboost',
            guildId: this.voiceConnection.guildID,
            enabled
        });
        if (enabled !== this.bassboost) this.bassboost = enabled;
        this.bands.length = 0;
        return true;
    }

    async setVaporWave(enabled = false) {
        await this.voiceConnection.node.send({
            op: 'vaporwave',
            guildId: this.voiceConnection.guildID,
            enabled
        });
        if (enabled !== this.vaporwave) this.vaporwave = enabled;
        return true;
    }

    async resetFilters(reset) {
        if (!reset) return false;
        await this.voiceConnection.node.send({
            op: 'reset',
            guildId: this.voiceConnection.guildID,
            reset
        });
        let oldpos = Number(this.position);
        this._resetPlayer();
        this.position = oldpos;
        return true;
    }

    _resetPlayer() {
        this.track = null;
        this.position = 0;
        this.bands.length = 0;
        this.vaporwave = false;
        this.bassboost = false;
        this.nightcore = 1.0;
        this.karaoke = false;
    }

    async _resume() {
        try {
            if (!this.track) return this._listen('error', new ShoukakuError('No Track Found upon trying to resume.'));
            await this.playTrack(this.track, { startTime: this.position });
            if (this.bands.length) await this.setEqualizer(this.bands);
            if (this.volume !== 100) await this.setVolume(this.volume);
            if (this.vaporwave) await this.setVaporWave(this.vaporwave);
            if (this.bassboost) await this.setBassBoost(this.bassboost);
            if (this.karaoke) await this.setKaraoke(this.karaoke);
            if (this.nightcore !== 1.0) await this.setNightcore(this.nightcore);
            this._listen('resumed', null);
        } catch (error) {
            this._listen('error', error);
        }
    }


    _listen(event, data) {
        if (endEvents.includes(event)) {
            if (event === 'nodeDisconnect') {
                this._resetPlayer();
            } else {
                this.track = null;
                this.position = 0;
            }
            this.emit(event, data);
            return;
        }
        if (data) this.position = data.position;
        this.emit(event, data);
    }
}
module.exports = ShoukakuPlayer;
