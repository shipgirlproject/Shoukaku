const EventEmitter = require('events');
const { ShoukakuPlayOptions, ShoukakuStatus, KaraokeValue, TimescaleValue, TremoloValue, VibratoValue, RotationValue, DistortionValue } = require('../constants/ShoukakuConstants.js');
const { CONNECTED } = ShoukakuStatus;
const { mergeDefault, wait } = require('../util/ShoukakuUtil.js');
const ShoukakuLink = require('./ShoukakuLink.js');
const ShoukakuFilter = require('../constants/ShoukakuFilter.js');
const ShoukakuError = require('../constants/ShoukakuError.js');
const ShoukakuTrack = require('../constants/ShoukakuTrack.js');

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
         * The Voice Connection of this Player.
         * @type {ShoukakuLink}
         */
        this.voiceConnection = new ShoukakuLink(this, node, guild);
        /**
         * The Track that is currently being played by this player
         * @type {?string}
         */
        this.track = null;
        /**
         * If this player is currently paused.
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

    get bridgeWSTimeout() {
        const discordPing = this.voiceConnection.shardPing;
        const lavalinkPing = this.voiceConnection.node.ping;
        return lavalinkPing < discordPing ? discordPing + lavalinkPing : 0;
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
     * // <Player> is your ShoukakuPlayer instance
     * <Player>.on('closed', reason => console.log(reason) & <Player>.disconnect())
     */
    /**
     * Emitted when this library encounters an internal error in ShoukakuPlayer or ShoukakuLink, MUST BE HANDLED.
     * @event ShoukakuPlayer#error
     * @param {ShoukakuError|Error} error The error encountered.
     * @memberOf ShoukakuPlayer
     * @example
     * // <Player> is your ShoukakuPlayer instance
     * <Player>.on('error', error => console.error(error) & <Player>.disconnect());
     */
    /**
     * Emitted when this player's node was disconnected, MUST BE HANDLED.
     * @event ShoukakuPlayer#nodeDisconnect
     * @param {string} name The name of the node that disconnected.
     * @memberOf ShoukakuPlayer
     * @example
     * // <Player> is your ShoukakuPlayer instance
     * <Player>.on('nodeDisconnect', name => console.log(`Node ${name} which governs this player disconnected`) & <Player>.disconnect());
     */
    /**
     * Emitted when the Lavalink Server sends a TrackStartEvent, Optional.
     * @event ShoukakuPlayer#start
     * @param {Object} data
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when the Lavalink Server sends a TrackExceptionEvent, Automatically fires TrackEndEvent so handling this is optional, Optional.
     * @event ShoukakuPlayer#trackException
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
     * @event ShoukakuPlayer#playerUpdate
     * @param {Object} data
     * @memberOf ShoukakuPlayer
     */

    /**
     * Eventually Connects the Bot to the voice channel in the guild. This is used internally and must not be used to connect players. Use `<ShoukakuSocket>.joinVoiceChannel()` instead.
     * @memberOf ShoukakuPlayer
     * @returns {Promise<void>}
     */
    connect(options) {
        return this.voiceConnection.connect(options);
    }
    /**
     * Eventually Disconnects the VoiceConnection & Removes the player from a Guild. Could be also used to clean up player remnants from unexpected events.
     * @memberOf ShoukakuPlayer
     * @returns {void}
     */
    disconnect() {
        return this.voiceConnection.disconnect();
    }
    /**
     * Moves this Player & VoiceConnection to another lavalink node you specified.
     * @param {string} name Name of the Node you want to move to.
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async moveToNode(name) {
        const node = this.voiceConnection.node.shoukaku.nodes.get(name);
        if (!node || node.name === this.voiceConnection.node.name) return this;
        if (node.state !== CONNECTED)
            throw new ShoukakuError('The node you specified is not ready.');
        await this.voiceConnection.moveToNode(node);
        return this;
    }
    /**
     * Plays a track.
     * @param {string|ShoukakuTrack} track The Base64 track from the Lavalink Rest API or a ShoukakuTrack.
     * @param {ShoukakuPlayOptions} [options] Used if you want to put a custom track start or end time.
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async playTrack(input, options) {
        if (!input) throw new ShoukakuError('No track given to play');
        if (input instanceof ShoukakuTrack) input = input.track;
        options = mergeDefault(ShoukakuPlayOptions, options);
        const { noReplace, startTime, endTime, pause } = options;
        const payload = {
            op: 'play',
            guildId: this.voiceConnection.guildID,
            track: input,
            noReplace,
            pause
        };
        if (startTime) payload.startTime = startTime;
        if (endTime) payload.endTime = endTime;
        await this.voiceConnection.node.send(payload);
        this.track = input;
        this.paused = pause;
        this.position = 0;
        return this;
    }
    /**
     * Stops the player from playing.
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async stopTrack() {
        this.position = 0;
        await this.voiceConnection.node.send({
            op: 'stop',
            guildId: this.voiceConnection.guildID
        });
        return this;
    }
    /**
     * Pauses / Unpauses the player
     * @param {boolean} [pause=true] true to pause, false to unpause
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async setPaused(pause = true) {
        await this.voiceConnection.node.send({
            op: 'pause',
            guildId: this.voiceConnection.guildID,
            pause
        });
        this.paused = pause;
        return this;
    }
    /**
     * Seeks your player to the time you want
     * @param {number} position position in MS you want to seek to.
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async seekTo(position) {
        if (!Number.isInteger(position))
            throw new ShoukakuError('Please input a valid number for position');
        await this.voiceConnection.node.send({
            op: 'seek',
            guildId: this.voiceConnection.guildID,
            position
        });
        return this;
    }
    /**
     * Sets the playback volume of your lavalink player
     * @param {number} volume The new volume you want to set on the player.
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async setVolume(volume) {
        if (Number.isNaN(volume)) throw new ShoukakuError('Please input a valid number for volume');
        volume = Math.min(5, Math.max(0, volume));
        this.filters.volume = volume;
        await this.updateFilters();
        return this;
    }
    /**
     * Sets the equalizer of your lavalink player
     * @param {Array<ShoukakuConstants#EqualizerBand>} bands An array of Lavalink bands.
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async setEqualizer(bands) {
        if (!bands || !Array.isArray(bands)) throw new ShoukakuError('No bands, or the band you gave isn\'t an array');
        // input sanitation, to ensure no additional keys is being introduced
        this.filters.equalizer = bands.map(({ band, gain }) => { return { band, gain }; });
        await this.updateFilters();
        return this;
    }
    /**
     * Sets the karaoke effect of your lavalink player
     * @param {ShoukakuConstants#KaraokeValue} [karaokeValue] Karaoke settings for this playback
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async setKaraoke(karaokeValue) {
        if (!karaokeValue) {
            this.filters.karaoke = null;
        } else {
            // input sanitation, to ensure no additional keys is being introduced
            const values = {};
            for (const key of Object.keys(karaokeValue)) {
                if (key in KaraokeValue) values[key] = karaokeValue[key];
            }
            this.filters.karaoke = values;
        }
        await this.updateFilters();
        return this;
    }
    /**
     * Sets the timescale effect of your lavalink player
     * @param {ShoukakuConstants#TimescaleValue} [timescaleValue] Timescale settings for this playback
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async setTimescale(timescaleValue) {
        if (!timescaleValue) {
            this.filters.timescale = null;
        } else {
            // input sanitation, to ensure no additional keys is being introduced
            const values = {};
            for (const key of Object.keys(timescaleValue)) {
                if (key in TimescaleValue) values[key] = timescaleValue[key];
            }
            this.filters.timescale = values;
        }
        await this.updateFilters();
        return this;
    }
    /**
     * Sets the tremolo effect of your lavalink player
     * @param {ShoukakuConstants#TremoloValue} [tremoloValue] Tremolo settings for this playback
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async setTremolo(tremoloValue) {
        if (!tremoloValue) {
            this.filters.tremolo = null;
        } else {
            // input sanitation, to ensure no additional keys is being introduced
            const values = {};
            for (const key of Object.keys(tremoloValue)) {
                if (key in TremoloValue) values[key] = tremoloValue[key];
            }
            this.filters.tremolo = values;
        }
        await this.updateFilters();
        return this;
    }
    /**
     * Sets the vibrato effect of your lavalink player
     * @param {ShoukakuConstants#VibratoValue} [vibratoValue] Vibrato settings for this playback
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async setVibrato(vibratoValue) {
        if (!vibratoValue) {
            this.filters.vibrato = null;
        } else {
            // input sanitation, to ensure no additional keys is being introduced
            const values = {};
            for (const key of Object.keys(vibratoValue)) {
                if (key in VibratoValue) values[key] = vibratoValue[key];
            }
            this.filters.vibrato = values;
        }
        await this.updateFilters();
        return this;
    }
    /**
     * Sets the rotation effect of your lavalink player
     * @param {ShoukakuConstants#RotationValue} [rotationValue] Rotation settings for this playback
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async setRotation(rotationValue) {
        if (!rotationValue) {
            this.filters.rotation = null;
        } else {
            // input sanitation, to ensure no additional keys is being introduced
            const values = {};
            for (const key of Object.keys(rotationValue)) {
                if (key in RotationValue) values[key] = rotationValue[key];
            }
            this.filters.rotation = values;
        }
        await this.updateFilters();
        return this;
    }
    /**
     * Sets the distortion effect of your lavalink player
     * @param {ShoukakuConstants#DistortionValue} [distortionValue] Distortion settings for this playback
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async setDistortion(distortionValue) {
        if (!distortionValue) {
            this.filters.distortion = null;
        } else {
            // input sanitation, to ensure no additional keys is being introduced
            const values = {};
            for (const key of Object.keys(distortionValue)) {
                if (key in DistortionValue) values[key] = distortionValue[key];
            }
            this.filters.distortion = values;
        }
        await this.updateFilters();
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
    async setGroupedFilters(settings) {
        this.filters = new ShoukakuFilter(settings);
        await this.updateFilters();
        return this;
    }
    /**
     * Clears all the filter applied on this player
     * @memberOf ShoukakuPlayer
     * @returns {Promise<ShoukakuPlayer>}
     */
    async clearFilters() {
        this.filters = new ShoukakuFilter();
        await this.voiceConnection.node.send({
            op: 'filters',
            guildId: this.voiceConnection.guildID
        });
        return this;
    }
    /**
     * Tries to resume your player, a use case for this is when you do <ShoukakuPlayer>.voiceConnection.attemptReconnect()
     * @memberOf ShoukakuPlayer
     * @returns {Promise<void>}
     * @example
     * <ShoukakuPlayer>.voiceConnection.attemptReconnect()
     *     .then(() => <ShoukakuPlayer>.resume());
     */
    async resume() {
        try {
            await this.updateFilters();
            if (this.track) await this.playTrack(this.track, { startTime: this.position, pause: this.paused });
            this.emit('resumed');
        } catch (error) {
            this.emit('error', error);
        }
    }

    async updateFilters() {
        const { volume, equalizer, karaoke, timescale, tremolo, vibrato, rotation, distortion } = this.filters;
        await this.voiceConnection.node.send({
            op: 'filters',
            guildId: this.voiceConnection.guildID,
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

    reset() {
        this.track = null;
        this.position = 0;
        this.filters = new ShoukakuFilter();
    }

    async _onLavalinkMessage(json) {
        if (json.op === 'playerUpdate') {
            this.position = json.state.position;
            this.emit('playerUpdate', json.state);
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
                    this.emit('trackException', json);
                    break;
                case 'WebSocketClosedEvent':
                    if (this.voiceConnection.reconnecting) break;
                    // to ensure this thing won't execute "BEFORE" Discord WS sends a message, smh race conditions just smh, smh again
                    await wait(this.bridgeWSTimeout);
                    if (this.voiceConnection.channelMoved || this.voiceConnection.voiceMoved) {
                        this.voiceConnection.node.emit('debug', this.voiceConnection.node.name, 
                            '[Player] -> [Voice]   : Channel / Server Move Detected\n' + 
                            `  Node                : ${this.voiceConnection.node.name}\n` +
                            `  Channel Moved?      : ${this.voiceConnection.channelMoved}\n` +
                            `  Voice Server Moved? : ${this.voiceConnection.voiceMoved}\n`
                        );
                        this.voiceConnection.channelMoved = false;
                        this.voiceConnection.voiceMoved = false;
                        break;
                    }
                    this.voiceConnection.node.emit('debug', this.voiceConnection.node.name, 
                        '[Player] -> [Voice] : Voice Websocket Closed Event\n' + 
                        `  Node              : ${this.voiceConnection.node.name}\n` +
                        `  Code              : ${json.code}\n` +
                        `  Reason            : ${json.reason}\n`
                    );
                    this.emit('closed', json);
                    break;
                default:
                    this.voiceConnection.node.emit('debug', this.voiceConnection.node.name, 
                        '[Node] -> [Player] : Unknown Player Event Type\n' + 
                        `  Node             : ${this.voiceConnection.node.name}\n` +
                        `  Type             : ${json.type}`
                    );
            }
            return;
        }
        this.voiceConnection.node.emit('debug', this.voiceConnection.node.name, 
            '[Node] -> [Player] : Unknown Message OP\n' + 
            `  Node             : ${this.voiceConnection.node.name}\n` +
            `  Type             : ${json.op}`
        );
    }
}
module.exports = ShoukakuPlayer;
