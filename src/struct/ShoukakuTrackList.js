const ShoukakuTrack = require('./ShoukakuTrack.js');
const ShoukakuTrackListException = require('./ShoukakuTrackListException');
const Types = { PLAYLIST_LOADED: 'PLAYLIST', TRACK_LOADED: 'TRACK', SEARCH_RESULT: 'SEARCH', NO_MATCHES: 'NO_MATCHES', LOAD_FAILED: 'LOAD_FAILED' };
/**
 * Represents a list track resolved from lavalink's rest
 * @class ShoukakuTrackList
 */
class ShoukakuTrackList {
    /**
     * @param {Object} raw Raw data from lavalink rest
     */
    constructor(raw) {
        /**
         * Type of ShoukakuTrackList, can be PLAYLIST, TRACK, SEARCH, NO_MATCHES or LOAD_FAILED.
         * @type {string}
         */
        this.type = Types[raw.loadType];
        /**
         * Name of this playlist, defaults to null of the result is not a playlist
         * @type {?string}
         */
        this.playlistName = this.type === Types.PLAYLIST_LOADED ? raw.playlistInfo.name : null;
        /**
         * Selected track in this playlist, defaults to null if type not PLAYLIST_LOADED
         * @type {?number}
         */
        this.selectedTrack = this.type === Types.PLAYLIST_LOADED ? raw.playlistInfo.selectedTrack : null;
        /**
         * An array of tracks from this trackList
         * @type {ShoukakuTrack[]}
         */
        this.tracks = raw.tracks?.map(d => new ShoukakuTrack(d)) || [];
        /**
         * Exception from lavalink, defaults to null if type not LOAD_FAILED
         * @type {?ShoukakuTrackListException}
         */
        this.exception = this.type === Types.LOAD_FAILED ? new ShoukakuTrackListException(raw.exception) : null;
    }
}

module.exports = ShoukakuTrackList;
