const EventEmitter = require('events');
const { state } = require('../Constants.js');
const { mergeDefault } = require('../Utils.js');

const ShoukakuConnection = require('./ShoukakuConnection.js');
const ShoukakuTrack = require('../struct/ShoukakuTrack.js');
const ShoukakuFilter = require('../struct/ShoukakuFilter.js');

/**
 * ShoukakuPlayer, used to control the player on a guild
 * @class ShoukakuPlayer
 */
class ShoukakuPlayer extends EventEmitter {
    /**
     * @extends {EventEmitter}
     * @param {ShoukakuSocket} node The node where this class is initialized
     * @param {Object} options JoinVoiceChannel options
     */
    constructor(node, options) {
        super();
        /**
         * The voice connection manager of this player
         * @type {ShoukakuConnection}
         */
        this.connection = new ShoukakuConnection(this, node, options);
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
         * The current postion in of this player, in milliseconds
         * @type {number}
         */
        this.position = 0;
        /**
         * The current filter settings for this player
         * @type {ShoukakuFilter}
         */
        this.filters = new ShoukakuFilter();
    }

    /**
     * Emitted when the lavalink player emits a 'TrackEndEvent' or 'TrackStuckEvent'
     * @event ShoukakuPlayer#end
     * @param {Object} reason
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when the lavalink player emits a WebsocketClosedEvent
     * @event ShoukakuPlayer#closed
     * @param {Object} reason
     * @memberOf ShoukakuPlayer
     * @example
     * Player.on('closed', reason => console.log(reason) && Player.disconnect());
     */
    /**
     * Emitted when the lavalink player emits a TrackStartEvent
     * @event ShoukakuPlayer#start
     * @param {Object} data
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when the lavalink player emits a TrackExceptionEvent, automatically fires TrackEndEvent so handling this is optional
     * @event ShoukakuPlayer#exception
     * @param {Object} reason
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when this library managed to resumed this player
     * @event ShoukakuPlayer#resumed
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when the lavalink player emits a PlayerUpdate event
     * @event ShoukakuPlayer#update
     * @param {Object} data
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when the node where this player is have been disconnected
     * @event ShoukakuPlayer#disconnect
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
            guildId: this.connection.guildId
        });
        this.connection.node.players.delete(this.connection.guildId);
        this.connection.node = node;
        this.connection.node.players.set(this.connection.guildId, this);
        this.connection.node.send({
            op: 'voiceUpdate',
            guildId: this.connection.guildId,
            sessionId: this.connection.sessionId,
            event: this.connection.serverUpdate
        });
        this.resume();
        return this;
    }
    /**
     * Plays a track
     * @param {string|ShoukakuTrack} track The Base64 track from the Lavalink Rest API or a ShoukakuTrack
     * @param {Object} [options={}] Optional arguments to pass
     * @param {boolean} [options.noReplace=true] Specifies if the player will not replace the current track when executing this action
     * @param {boolean} [options.pause=false] If `true`, the player will pause when the track starts playing
     * @param {number} [options.startTime] In milliseconds on when to start
     * @param {number} [options.endTime] In milliseconds on when to end
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    playTrack(input, options = {}) {
        if (!input) throw new Error('No track given to play');
        if (input instanceof ShoukakuTrack) input = input.track;
        options = mergeDefault({ noReplace: true, pause: false }, options);
        const payload = {
            op: 'play',
            guildId: this.connection.guildId,
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
     * Stops the player from playing
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    stopTrack() {
        this.position = 0;
        this.connection.node.send({
            op: 'stop',
            guildId: this.connection.guildId
        });
        return this;
    }
    /**
     * Pauses or unpauses the player from playing
     * @param {boolean} [pause=true] true to pause, false to unpause
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setPaused(pause = true) {
        this.connection.node.send({
            op: 'pause',
            guildId: this.connection.guildId,
            pause
        });
        this.paused = pause;
        return this;
    }
    /**
     * Seeks your player to the time you want
     * @param {number} position Time in milliseconds where you want to seek to
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    seekTo(position) {
        if (!Number.isInteger(position)) throw new Error('Please input a valid number for position');
        this.connection.node.send({
            op: 'seek',
            guildId: this.connection.guildId,
            position
        });
        return this;
    }
    /**
     * Sets the playback volume of your lavalink player
     * @param {number} volume Float value where 1.0 is 100%. Values >1.0 may cause clipping
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
     * @param {Object[]} bands
     * @param {number} bands.band Band of the equalizer, can be 0 - 13
     * @param {number} bands.gain Gain for this band of the equalizer
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
     * Uses equalization to eliminate part of a band, usually targeting vocals
     * @param {Object|null} values
     * @param {number} [values.level] Karaoke effect level
     * @param {number} [values.monoLevel] Karaoke effect monoLevel
     * @param {number} [values.filterBand] Karaoke effect filterband
     * @param {number} [values.filterWidth] Karaoke effect filterwidth
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setKaraoke(values) {
        this.filters.karaoke = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Changes the speed, pitch, and rate
     * @param {Object|null} values
     * @param {number} [values.speed] Timescale effect speed
     * @param {number} [values.pitch] Timescale effect pitch
     * @param {number} [values.rate] Timescale effect rate
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setTimescale(values) {
        this.filters.timescale = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Uses amplification to create a shuddering effect, where the volume quickly oscillates
     * @param {Object|null} values
     * @param {number} [values.frequency] Tremolo effect frequency
     * @param {number} [values.depth] Tremolo effect depth
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setTremolo(values) {
        this.filters.tremolo = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Similar to tremolo. While tremolo oscillates the volume, vibrato oscillates the pitch
     * @param {Object|null} values
     * @param {number} [values.frequency] Vibrato effect frequency
     * @param {number} [values.depth] Vibrato effect depth
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setVibrato(values) {
        this.filters.vibrato = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Rotates the sound around the stereo channels/user headphones aka Audio Panning
     * @param {Object|null} values
     * @param {number} [values.rotationHz] Rotation effect rotation
     * @param ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setRotation(values) {
        this.filters.rotation = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Distortion effect. It can generate some pretty unique audio effects
     * @param {Object|null} values
     * @param {number} [values.sinOffset] Sin offset of the distortion effect
     * @param {number} [values.sinScale] Sin scale of the distortion effect
     * @param {number} [values.cosOffset] Cos offset of the distortion effect
     * @param {number} [values.cosScale] Cos scale of the distortion effect
     * @param {number} [values.tanOffset] Tan offset of the distortion effect
     * @param {number} [values.tanScale] Tan scale of the distortion effect
     * @param {number} [values.offset] Offset of the distortion effect
     * @param {number} [values.scale] Scale of the distortion effect
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setDistortion(values) {
        this.filters.distortion = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Mixes both channels (left and right), with a configurable factor on how much each channel affects the other
     * @param {Object|null} values
     * @param {number} [values.leftToLeft] Sets the channel mix value of left to left
     * @param {number} [values.leftToRight] Sets the channel mix value of left to right
     * @param {number} [values.rightToLeft] Sets the channel mix value of right to left
     * @param {number} [values.rightToRight] Sets the channel mix value of right to right
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setChannelMix(values) {
        this.filters.channelMix = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Higher frequencies get suppressed, while lower frequencies pass through this filter, thus the name low pass
     * @param {Object|null} values
     * @param {number} [values.smoothing] Sets the smoothing of low pass filter
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setLowPass(values) {
        this.filters.lowPass = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Ability to set filters by group instead of 1 by 1
     * @param {ShoukakuFilter} [settings] object containing filter settings
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setFilters(settings) {
        this.filters = new ShoukakuFilter(settings);
        this.updateFilters();
        return this;
    }
    /** 
     * Clears all the filter applied on this player
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    clearFilters() {
        this.filters = new ShoukakuFilter();
        this.connection.node.send({
            op: 'filters',
            guildId: this.connection.guildId
        });
        return this;
    }
    /**
     * Tries to resume your player, a use case for this is when you do ShoukakuPlayer.connection.attemptReconnect()
     * @memberOf ShoukakuPlayer
     * @param {Object} [options={}] Optional arguments for playTrack to process
     * @param {boolean} [options.noReplace=true] Specifies if the player will not replace the current track when executing this action
     * @param {boolean} [options.pause] If `true`, the player will pause when the track starts playing
     * @param {number} [options.startTime] In milliseconds on when to start
     * @param {number} [options.endTime] In milliseconds on when to end
     * @returns {ShoukakuPlayer}
     * @example
     * ShoukakuPlayer
     *   .connection
     *   .reconnect()
     *   .then(() => ShoukakuPlayer.resume());
     */
    resume(options = {}) {
        this.updateFilters();
        if (this.track) {
            options = mergeDefault({ startTime: this.position, pause: this.paused }, options);

            this.playTrack(this.track, options);
        }
        this.emit('resumed');
        return this;
    }
    /**
     * @memberOf ShoukakuPlayer
     * @private
     */
    updateFilters() {
        const { volume, equalizer, karaoke, timescale, tremolo, vibrato, rotation, distortion, channelMix, lowPass } = this.filters;
        this.connection.node.send({
            op: 'filters',
            guildId: this.connection.guildId,
            volume,
            equalizer,
            karaoke,
            timescale,
            tremolo,
            vibrato,
            rotation,
            distortion,
            channelMix,
            lowPass
        });
    }
    /**
     * @memberOf ShoukakuPlayer
     * @protected
     */
    clean() {
        this.removeAllListeners();
        this.reset();
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
     * @param {ShoukakuSocket} socket
     * @protected
     */
    _onLavalinkMessage(json, socket) {
        if (json.op === 'playerUpdate') {
            this.position = json.state.position;
            this.emit('update', json);
            socket.emit('playerUpdate', this, json);
        }
        else if (json.op === 'event') 
            this._onPlayerEvent(json, socket);
        else 
            this.connection.node.emit('debug', this.connection.node.name, `[Player] -> [Node] : Unknown Message OP ${json.op} | Guild: ${this.connection.guildId}`);
    }
    /**
     * @memberOf ShoukakuPlayer
     * @param {Object} json
     * @private
     */
    _onPlayerEvent(json, socket) {
        switch (json.type) {
            case 'TrackStartEvent':
                this.position = 0;
                this.emit('start', json);
                socket.emit('playerTrackStart', this, json);
                break;
            case 'TrackEndEvent':
            case 'TrackStuckEvent':
                this.emit('end', json);
                socket.emit('playerTrackEnd', this, json);
                break;
            case 'TrackExceptionEvent':
                this.emit('exception', json);
                socket.emit('playerException', this, json);
                break;
            case 'WebSocketClosedEvent':
                if (!this.connection.reconnecting) {
                    if (!this.connection.moved) {
                        this.emit('closed', json);
                        socket.emit('playerClosed', this, json);
                    } else 
                        this.connection.moved = false;
                }
                break;
            default:
                this.connection.node.emit(
                    'debug',
                    this.connection.node.name,
                    `[Player] -> [Node] : Unknown Player Event Type ${json.type} | Guild: ${this.connection.guildId}`
                );
        }
    }
}
module.exports = ShoukakuPlayer;
