const EventEmitter = require('events');
const { state } = require('../Constants.js');
const { mergeDefault, wait } = require('../Utils.js');

const ShoukakuConnection = require('./ShoukakuConnection.js');
const ShoukakuTrack = require('../struct/ShoukakuTrack.js');
const ShoukakuFilter = require('../struct/ShoukakuFilter.js');

/**
 * ShoukakuPlayer, used to control the player on a guild
 * @class ShoukakuPlayer
 * @extends {EventEmitter}
 */
class ShoukakuPlayer extends EventEmitter {
    /**
     * @param  {ShoukakuSocket} node The node that governs this player
     * @param  {Guild} guild A Discord.JS Guild Object
     */
    constructor(node, guild) {
        super();
        /**
         * The voice connection manager of this player
         * @type {ShoukakuConnection}
         */
        this.connection = new ShoukakuConnection(this, node, guild);
        /**
         * The track that is currently being played by this player
         * @type {?string}
         */
        this.track = null;
        /**
         * If this player is currently paused
         * @type {boolean}
         */
        this.paused = false;
        /**
         * The current postion in ms of this player
         * @type {number}
         */
        this.position = 0;
        /**
         * Current filter settings for this player
         * @type {ShoukakuFilter}
         */
        this.filters = new ShoukakuFilter();
    }

    /**
     * Emitted when the Lavalink Server sends a TrackEndEvent or TrackStuckEvent, MUST BE HANDLED.
     * @event ShoukakuPlayer#end
     * @param {Object} reason
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when the Lavalink Server sends a WebsocketClosedEvent, MUST BE HANDLED.
     * @event ShoukakuPlayer#closed
     * @param {Object} reason
     * @memberOf ShoukakuPlayer
     * @example
     * Player.on('closed', reason => console.log(reason) & Player.disconnect())
     */
    /**
     * Emitted when this library encounters an internal error in ShoukakuPlayer or ShoukakuLink, MUST BE HANDLED.
     * @event ShoukakuPlayer#error
     * @param {ShoukakuError|Error} error The error encountered.
     * @memberOf ShoukakuPlayer
     * @example
     * Player.on('error', error => console.error(error) & Player.disconnect());
     */
    /**
     * Emitted when the Lavalink Server sends a TrackStartEvent, Optional.
     * @event ShoukakuPlayer#start
     * @param {Object} data
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when the Lavalink Server sends a TrackExceptionEvent, Automatically fires TrackEndEvent so handling this is optional, Optional.
     * @event ShoukakuPlayer#exception
     * @param {Object} reason
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when this library managed to resume playing this player, Optional.
     * @event ShoukakuPlayer#resumed
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when the Lavalink Server sends a PlayerUpdate OP, Optional.
     * @event ShoukakuPlayer#update
     * @param {Object} data
     * @memberOf ShoukakuPlayer
     */

    /**
     * Moves this player and connection to another node
     * @param {string} name Name of the Node you want to move to
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    moveNode(name) {
        const node = this.connection.node.shoukaku.nodes.get(name);
        if (!node || node.name === this.connection.node.name) return this;
        if (node.state !== state.CONNECTED) throw new Error('The node you specified is not ready');
        this.connection.node.send({ 
            op: 'destroy', 
            guildId: this.connection.guildID 
        });
        this.connection.node.players.delete(this.guildID);
        this.connection.node = node;
        this.connection.node.players.set(this.guildID, this.player);
        this.connection.node.send({ 
            op: 'voiceUpdate', 
            guildId: this.connection.guildID, 
            sessionId: this.connection.sessionID, 
            event: this.connection.serverUpdate 
        });
        this.resume();
        return this;
    }
    /**
     * Plays a track
     * @param {string|ShoukakuTrack} track The Base64 track from the Lavalink Rest API or a ShoukakuTrack
     * @param {Object} [options={}] Used if you want to put a custom track start or end time
     * @property {boolean} [options.noReplace=true] Specifies if the player will not replace the current track when executing this action
     * @property {boolean} [options.pause=false] If `true`, the player will pause when the track starts playing
     * @property {?number} [options.startTime=undefined] In milliseconds on when to start
     * @property {?number} [options.endTime=undefined] In milliseconds on when to end
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */ 
    playTrack(input, options = {}) {
        if (!input) throw new Error('No track given to play');
        if (input instanceof ShoukakuTrack) input = input.track;
        options = mergeDefault({ noReplace: true, pause: false }, options);
        const payload = {
            op: 'play',
            guildId: this.connection.guildID,
            track: input,
            noReplace: options.noReplace,
            pause: options.pause
        };
        if (options.startTime) payload.startTime = options.startTime;
        if (options.endTime) payload.endTime = options.endTime;
        this.connection.node.send(payload);
        this.track = input;
        this.paused = options.pause;
        this.position = 0;
        return this;
    }
    /**
     * Stops the player from playing.
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    stopTrack() {
        this.position = 0;
        this.connection.node.send({
            op: 'stop',
            guildId: this.connection.guildID
        });
        return this;
    }
    /**
     * Pauses / Unpauses the player
     * @param {boolean} [pause=true] true to pause, false to unpause
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setPaused(pause = true) {
        this.connection.node.send({
            op: 'pause',
            guildId: this.connection.guildID,
            pause
        });
        this.paused = pause;
        return this;
    }
    /**
     * Seeks your player to the time you want
     * @param {number} position position in MS you want to seek to.
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    seekTo(position) {
        if (!Number.isInteger(position)) throw new Error('Please input a valid number for position');
        this.connection.node.send({
            op: 'seek',
            guildId: this.connection.guildID,
            position
        });
        return this;
    }
    /**
     * Sets the playback volume of your lavalink player
     * @param {number} volume The new volume you want to set on the player.
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setVolume(volume) {
        if (Number.isNaN(volume)) throw new Error('Please input a valid number for volume');
        volume = Math.min(5, Math.max(0, volume));
        this.filters.volume = volume;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the equalizer of your lavalink player
     * @param {Array<ShoukakuConstants#EqualizerBand>} bands An array of Lavalink bands.
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setEqualizer(bands) {
        if (!bands || !Array.isArray(bands)) throw new Error('No bands, or the band you gave isn\'t an array');
        this.filters.equalizer = bands;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the karaoke effect of your lavalink player
     * @param {ShoukakuConstants#KaraokeValue} [karaokeValue] Karaoke settings for this playback
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setKaraoke(values) {
        this.filters.karaoke = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the timescale effect of your lavalink player
     * @param {ShoukakuConstants#TimescaleValue} [timescaleValue] Timescale settings for this playback
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setTimescale(values) {
        this.filters.timescale = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the tremolo effect of your lavalink player
     * @param {ShoukakuConstants#TremoloValue} [tremoloValue] Tremolo settings for this playback
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setTremolo(values) {
        this.filters.tremolo = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the vibrato effect of your lavalink player
     * @param {ShoukakuConstants#VibratoValue} [vibratoValue] Vibrato settings for this playback
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setVibrato(values) {
        this.filters.vibrato = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the rotation effect of your lavalink player
     * @param {ShoukakuConstants#RotationValue} [rotationValue] Rotation settings for this playback
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setRotation(values) {
        this.filters.rotation = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the distortion effect of your lavalink player
     * @param {ShoukakuConstants#DistortionValue} [distortionValue] Distortion settings for this playback
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setDistortion(values) {
        this.filters.distortion = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Ability to set filters by group instead of 1 by 1
     * @param {Object} [settings] object containing filter settings
     * @param {Number} [settings.volume=1.0] volume of this filter
     * @param {Array<ShoukakuConstants#EqualizerBand>} [settings.equalizer=[]] equalizer of this filter
     * @param {ShoukakuConstants#KaraokeValue} [settings.karaoke] karaoke settings of this filter
     * @param {ShoukakuConstants#TimescaleValue} [settings.timescale] timescale settings of this filter
     * @param {ShoukakuConstants#TremoloValue} [settings.tremolo] tremolo settings of this filter
     * @param {ShoukakuConstants#VibratoValue} [settings.vibrato] vibrato settings of this filter
     * @param {ShoukakuConstants#RotationValue} [settings.rotation] rotation settings of this filter
     * @param {ShoukakuConstants#DistortionValue} [settings.distortion] distortion settings of this filter
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    setFilters(settings) {
        this.filters = new ShoukakuFilter(settings);
        this.updateFilters();
        return this;
    }
    /**
     * Clears all the filter applied on this player
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    clearFilters() {
        this.filters = new ShoukakuFilter();
        this.connection.node.send({
            op: 'filters',
            guildId: this.connection.guildID
        });
        return this;
    }
    /**
     * Tries to resume your player, a use case for this is when you do ShoukakuPlayer.connection.attemptReconnect()
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     * @example
     * ShoukakuPlayer.connection.attemptReconnect()
     *     .then(() => <ShoukakuPlayer>.resume());
     */
    resume() {
        this.updateFilters();
        if (this.track) this.playTrack(this.track, { startTime: this.position, pause: this.paused });
        this.emit('resumed');
        return this;
    }
    /**
     * @memberOf ShoukakuPlayer
     * @private
     */
    updateFilters() {
        const { volume, equalizer, karaoke, timescale, tremolo, vibrato, rotation, distortion } = this.filters;
        this.connection.node.send({
            op: 'filters',
            guildId: this.connection.guildID,
            volume,
            equalizer,
            karaoke,
            timescale,
            tremolo,
            vibrato,
            rotation,
            distortion
        });
    }
    /**
     * @memberOf ShoukakuPlayer
     * @protected
     */
    reset() {
        this.track = null;
        this.position = 0;
        this.filters = new ShoukakuFilter();
    }
    /**
     * @memberOf ShoukakuPlayer
     * @param {Object} json
     * @protected
     */
    _onLavalinkMessage(json) {
        if (json.op === 'playerUpdate') {
            this.position = json.state.position;
            this.emit('update', json.state);
            return;
        }
        if (json.op === 'event') {
            this.position = 0;
            switch (json.type) {
                case 'TrackStartEvent':
                    this.emit('start', json);
                    break;
                case 'TrackEndEvent':
                case 'TrackStuckEvent':
                    this.emit('end', json);
                    break;
                case 'TrackExceptionEvent':
                    this.emit('exception', json);
                    break;
                case 'WebSocketClosedEvent':
                    if (this.connection.reconnecting) break;
                    wait(this.connection.node.shoukaku.options.closedWebsocketEventDelay)
                        .then(() => {
                            if (this.connection.channelMoved || this.connection.voiceMoved) {
                                this.connection.node.emit('debug', 
                                    this.connection.node.name, 
                                    `[Node] -> [${this.connection.node.name}] : Move detected;` + 
                                    `Channel ${this.connection.channelMoved};` + 
                                    `Server ${this.connection.voiceMoved}`
                                );
                                this.connection.channelMoved = false;
                                this.connection.voiceMoved = false;
                                return;
                            }
                            this.emit('closed', json);
                        });
                    break;
                default:
                    this.connection.node.emit('debug', this.connection.node.name, `[Node] -> [${this.connection.node.name}] : Unknown Player Event Type ${json.type}`);
            }
            return;
        }
        this.connection.node.emit('debug', this.connection.node.name, `[Node] -> [${this.connection.node.name}] : Unknown Message OP ${json.op}`);
    }
}
module.exports = ShoukakuPlayer;
