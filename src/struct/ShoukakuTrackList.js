const ShoukakuTrack = require('./ShoukakuTrack.js');
const Types = { PLAYLIST_LOADED: 'PLAYLIST', TRACK_LOADED: 'TRACK', SEARCH_RESULT: 'SEARCH', NO_MATCHES: "NO_MATCHES", LOAD_FAILED: "LOAD_FAILED" };
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
         * Type of this list, can be PLAYLIST, TRACK or SEARCH. PLAYLIST and SEARCH can contain more than one tracks in tracks array while TRACK will contain a single track in the tracks array
         * @type {string}
         */
        this.type = Types[raw.loadType];
        /**
         * Information about the playlist contains name and selectTrack
         * @type {?object}
         */
        this.playlistInfo = this.type === Types.PLAYLIST_LOADED ? {
          name: raw.playlistInfo.name,
          selectedTrack: raw.playlistInfo.selectedTrack !== -1 ? raw.playlistInfo.selectedTrack : 0
        } : null;
        /**
         * An array of tracks from this trackList
         * @type {ShoukakuTrack[]}
         */
        this.tracks = raw.tracks?.map(d => new ShoukakuTrack(d)) || [];
    }
}

module.exports = ShoukakuTrackList;
