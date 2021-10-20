const ShoukakuTrack = require('./ShoukakuTrack.js');
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
         * Selected track in this playlist, defaults to 0 if not a playlist, or if the raw result is equal to -1
         * @type {number}
         */
        this.selectedTrack = this.type === Types.PLAYLIST_LOADED && raw.playlistInfo.selectedTrack !== -1 ? raw.playlistInfo.selectedTrack : 0;
        /**
         * An array of tracks from this trackList
         * @type {ShoukakuTrack[]}
         */
        this.tracks = raw.tracks?.map(d => new ShoukakuTrack(d)) || [];
    }
}

module.exports = ShoukakuTrackList;
