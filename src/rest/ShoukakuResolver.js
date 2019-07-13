const Fetch = require('node-fetch');
const Abort = require('abort-controller');
const Search = {
    'soundcloud': 'scsearch',
    'youtube': 'ytsearch'
};
const Success = ['TRACK_LOADED', 'PLAYLIST_LOADED', 'SEARCH_RESULT'];
class ShoukakuResolver {
    /**
     * ShoukakuResolver, the REST part of the wrapper
     * @param {string} host Your node host / ip address of where the lavalink is hosted.
     * @param {string} port The Port Number of your lavalink instance.
     * @param {string} auth The authentication key you set on your lavalink config.
     * @param {number} timeout Timeout before a request times out.
     */
    constructor(host, port, auth, timeout) {
        /**
         * This Resolver Timeout before it decides to cancel the request.
         * @type {number}
         */
        this.timeout = timeout || 10000;

        Object.defineProperty(this, 'auth', { value: auth });
        Object.defineProperty(this, 'url', { value: `http://${host}:${port}/` });
    }
    /**
    * Resolves a identifier into a lavalink track.
    * @param {string} identifier Anything you want for lavalink to search for
    * @param {string} search Either `youtube` or `soundcloud`. If specified, resolve will return search results.
    * @returns {Promise<Object>} The Lavalink Track Object.
    */
    async resolve(identifier, search) {
        if (!identifier)
            throw new Error('Query cannot be null');
        if (search) {
            search = Search[search];
            if (!search) throw new Error('This search type is not supported');
            identifier = `${search}:${identifier}`;
        }
        const url = new URL(`${this.url}/loadtracks`);
        url.search = new URLSearchParams({ identifier });
        const data = await this._fetch(url.toString());

        if (!Success.includes(data.loadType)) return null;
        if (data.loadType === 'PLAYLIST_LOADED') {
            data.tracks.name = data.playlistInfo.name;
            return data.tracks;
        }
        if (data.loadType === 'TRACK_LOADED') {
            return data.tracks[0];
        }
        if (data.loadType === 'SEARCH_RESULT') {
            return data;
        }
    }
    /**
     * Decodes the given base64 encoded track from lavalink.
     * @param {base64} track Base64 Encoded Track you got from the Lavalink API.
     * @returns {Promise<Object>} The Lavalink Track details.
     */
    decode(track) {
        if (!track)
            throw new Error('Track cannot be null');
        const url = new URL(`${this.url}/decodetrack`);
        url.search = new URLSearchParams({ track });
        return this._fetch(url.toString());
    }

    _fetch(url) {
        const controller = new Abort();
        const timeout = setTimeout(() => controller.abort(), this.timeout);
        return Fetch(url, { headers: { Authorization: this.auth }, signal: controller.signal })
            .then((res) => {
                if (res.status !== 200)
                    throw new Error(`Shoukaku Resolver Failed. Error Code: ${res.status}`);
                return res.json();
            }, (error) => {
                if (error.name === 'AbortError') error = new Error(`Shoukaku Resolver Failed. Failed to fetch this video in ${Math.round(this.timeout / 1000)}s`);
                throw error;
            })
            .finally(() => clearTimeout(timeout));
    }
}
module.exports = ShoukakuResolver;
