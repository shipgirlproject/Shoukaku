/**
 * Represents a track resolved from Lavalink's rest
 * @class ShoukakuTrack
 */
class ShoukakuTrack {
    /**
     * @param {Object} raw Raw data from Lavalink rest
     */
    constructor(raw) {
        /**
         * Base64 string from the resolved track from Lavalink rest. Used for playTrack()
         * @type {string}
         */
        this.track = raw.track;
        /**
         * Info about the track
         * @type {Object}
         */
        this.info = {
            /**
             * Identifier of this track
             * @type {?string}
             */
            identifier: raw.info.identifier,
            /**
             * If this track is seekable
             * @type {?boolean}
             */
            isSeekable: raw.info.isSeekable,
            /**
             * The uploader or author of this track
             * @type {?string}
             */
            author: raw.info.author,
            /**
             * The length of this track in milliseconds
             * @type {?number}
             */
            length: raw.info.length,
            /**
             * If this track is a livestream
             * @type {?boolean}
             */
            isStream: raw.info.isStream,
            /**
             * Start position of this track when played
             * @type {?number}
             */
            position: raw.info.position,
            /**
             * Title of this track
             * @type {?string}
             */
            title: raw.info.title,
            /**
             * URL to this track
             * @type {?string}
             */
            uri: raw.info.uri
        };
    }
}

module.exports = ShoukakuTrack;
