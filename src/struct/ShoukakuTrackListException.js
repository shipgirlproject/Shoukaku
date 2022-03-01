/**
 * Exception class when ShoukakuTrackList type is LOAD_FAILED
 * @class ShoukakuTrackListException
 */
class ShoukakuTrackListException {
    /**
     * @param {Object} exception Raw exception data from lavalink rest
     */
    constructor(exception) {
        /**
         * Exception message from lavalink
         * @type {string}
         */
        this.message = exception.message;
        /**
         * Exception severity from lavalink
         * Can be one of: COMMON, SUSPICIOUS, FAULT (lavalplayer's FriendlyException#severity)
         * @type {string}
         */
        this.severity = exception.severity;
    }
}

module.exports = ShoukakuTrackListException;
