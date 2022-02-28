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
         * @type {string}
         */
        this.severity = exception.severity;
    }
}

module.exports = ShoukakuTrackListException;
