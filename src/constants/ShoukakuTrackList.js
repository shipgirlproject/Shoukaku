const ShoukakuTrack = require('./ShoukakuTrack.js');
const Types = { PLAYLIST_LOADED: 'PLAYLIST', TRACK_LOADED: 'TRACK', SEARCH_RESULT: 'SEARCH' };
/**
 * Represents a list track resolved from Lavalink's rest
 * @class ShoukakuTrackList
 */
class ShoukakuTrackList {
    /**
     * @param {Object} raw Raw data from Lavalink rest
     */
    constructor(raw) {
        /**
         * Type of this list, can be PLAYLIST, TRACK or SEARCH. PLAYLIST and SEARCH can contain more than one tracks in tracks array while TRACK will contain a single track in the tracks array.
         * @type {string}
         */
        this.type = Types[raw.loadType];
        /**
         * Name of this playlist, if type is PLAYLIST
         * @type {?string}
         */
        this.playlistName = this.type === Types.PLAYLIST_LOADED ? raw.playlistInfo.name : null;
        /**
         * An array of tracks from this TrackList
         * @type {Array<ShoukakuTrack>}
         */
        this.tracks = raw.tracks.length ? raw.tracks.map(d => new ShoukakuTrack(d)) : [];
    }
}

module.exports = ShoukakuTrackList;
