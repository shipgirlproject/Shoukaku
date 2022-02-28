/**
 * Exception class when ShoukakuTrackList type is LOAD_FAILED
 * @class ShoukakuTrackList
 */
class ShoukakuException {
    /**
     * @param {Object} raw Raw data from lavalink rest
     */
    constructor(raw) {
        /**
         * Exception message from lavalink
         * @type {string}
         */
        this.message = raw.message;
        /**
         * Exception severity from lavalink
         * @type {string}
         */
        this.severity = raw.severity;
    }
}

module.exports = ShoukakuException;
