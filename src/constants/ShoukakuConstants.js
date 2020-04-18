/**
 * Constants for Shoukaku.
 * @class ShoukakuConstants
 */
class ShoukakuConstants {
    /**
    * Available Status for Node / Link managers.
    * @typedef {string} ShoukakuStatus
    * @enum {ShoukakuStatus}
    * @memberof ShoukakuConstants#
    */
    static get ShoukakuStatus() {
        return {
            CONNECTING: 'CONNECTING',
            CONNECTED: 'CONNECTED',
            DISCONNECTING: 'DISCONNECTING',
            DISCONNECTED: 'DISCONNECTED'
        };
    }
    /**
    * Shoukaku's Node Stats Object.
    * @typedef {Object} ShoukakuNodeStats
    * @memberof ShoukakuConstants#
    */
    static get ShoukakuNodeStats() {
        return {
            playingPlayers: 0,
            op: 'stats',
            memory: {
                reservable: 0,
                used: 0,
                free: 0,
                allocated: 0
            },
            frameStats: {
                sent: 0,
                deficit: 0,
                nulled: 0
            },
            players: 0,
            cpu: {
                cores: 0,
                systemLoad: 0,
                lavalinkLoad: 0
            },
            uptime: 0
        };
    }
    /**
    * Required Object in Shoukaku's join method.
    * @typedef {Object} ShoukakuJoinOptions
    * @property {string} guildID Guild ID of the Voice Channel you want to join to.
    * @property {string} voiceChannelID Voice Channel ID of the Voice Channel you want to join to.
    * @property {boolean} [mute=false] Whether to mute the client.
    * @property {boolean} [deaf=false] Whether to deafen the client.
    * @memberof ShoukakuConstants#
    */
    static get ShoukakuJoinOptions() {
        return {
            guildID: null,
            voiceChannelID: null,
            mute: false,
            deaf: false
        };
    }
    /**
    * Required Object in Shoukaku's join method.
    * @typedef {Object} ShoukakuPlayOptions
    * @property {boolean} [noReplace=true] Specifies if the player will not replace the current track when executing this action.
    * @property {boolean|number} [startTime=false] In milliseconds on when to start.
    * @property {boolean|number} [endTime=false] In milliseconds on when to end.
    * @memberof ShoukakuConstants#
    */
    static get ShoukakuPlayOptions() {
        return {
            noReplace: true,
            startTime: false,
            endTime: false
        };
    }
    /**
    * Options that Shoukaku accepts upon initialization.
    * @typedef {Object} ShoukakuOptions
    * @property {boolean|string} [resumable=false] If you want your node to support resuming. Just replace the false with the resume-key you want to enable resuming.
    * @property {number} [resumableTimeout=30] Timeout when Lavalink will decide a player isn't resumed and will destroy the connection to it.
    * @property {number} [reconnectTries=2] Amount of tries to connect to the lavalink Node before it decides that the node is unreconnectable.
    * @property {number} [moveOnDisconnect=false] Specifies if the library will attempt to reconnect players on a disconnected node to another node.
    * @property {number} [restTimeout=10000] Timeout on rest requests to your lavalink node.
    * @memberof ShoukakuConstants#
    */
    static get ShoukakuOptions() {
        return {
            resumable: false,
            resumableTimeout: 30,
            reconnectTries: 2,
            moveOnDisconnect: false,
            restTimeout: 10000
        };
    }
    /**
    * Options that Shoukaku needs to initialize a lavalink node.
    * @typedef {Object} ShoukakuNodeOptions
    * @property {string} [name] Your Node Name, anything you want to name your node.
    * @property {string} [host] Your node host / ip address of where the lavalink is hosted.
    * @property {number} [port] The Port Number of your lavalink instance.
    * @property {string} [auth] The authentication key you set on your lavalink config.
    * @memberof ShoukakuConstants#
    */
    static get ShoukakuNodeOptions() {
        return {
            name: null,
            host: null,
            port: null,
            auth: null
        };
    }
    /**
     * An array of ShoukakuNodeOptions
     * @typedef {Array<ShoukakuNodeOptions>} ShoukakuNodes
     * @memberof ShoukakuConstants#
     */
    static get ShoukakuNodes() {
        return [].push(ShoukakuConstants.ShoukakuNodeOptions);
    }

    /**
     * Equalizer Band Object for Shoukaku's setEqualizer() object.
     * @typedef {EqualizerBand} EqualizerBand
     * @property {number} [band] There are 15 bands (0-14) from lowest to highest frequency
     * @property {number} [gain] Gain for this band, range can be -0.25 to 1.0 with -0.25 mutes the band, 0.25 doubles the band gain
     * @memberof ShoukakuConstants#
     */
    static get EqualizerBand() {
        return {
            band: 0,
            gain: 0
        };
    }
}
module.exports = ShoukakuConstants;
