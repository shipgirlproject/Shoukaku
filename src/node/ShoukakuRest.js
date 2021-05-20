const Petitio = require('petitio');
const ShoukakuRouter = require('./ShoukakuRouter.js');
const ShoukakuTrackList = require('../struct/ShoukakuTrackList.js');
const { searchType } = require('../Constants.js');

const Success = ['TRACK_LOADED', 'PLAYLIST_LOADED', 'SEARCH_RESULT'];
/**
 * ShoukakuRest, provides access to Lavalink REST API.
 * @class ShoukakuRest
 */
class ShoukakuRest {
    /**
     * @param {Object} node Options that you passed to initialize a lavalink node.
     * @param {Object} options agent to use per request
     */
    constructor({ url, auth, secure }, { userAgent, timeout }) {
        /**
        * URL of the host used by this resolver instance.
        * @type {string}
        */
        this.url = `${secure ? 'https' : 'http'}://${url}`;
        /**
         * This Resolver Timeout before it decides to cancel the request.
         * @type {number}
         */
        this.timeout = timeout || 15000;

        Object.defineProperty(this, 'auth', { value: auth });
        Object.defineProperty(this, 'userAgent', { value: userAgent });
    }

    get router() {
        return new ShoukakuRouter(this);
    }

    /**
    * Resolves a identifier into a lavalink track.
    * @param {string} identifier Anything you want for lavalink to search for
    * @param {string} [search] Either `youtube` or `soundcloud` or `youtubemusic`. If specified, resolve will return search results.
    * @memberof ShoukakuRest
    * @returns {Promise<void|ShoukakuTrackList>} The parsed data from Lavalink rest
    */
    async resolve(identifier, search) {
        if (!identifier) throw new Error('Identifier cannot be null');
        if (search) identifier = `${searchType(search)}:${identifier}`;
        const data = await this.router.loadTracks({ identifier }).get();
        if (!Success.includes(data.loadType)) return;
        return new ShoukakuTrackList(data);
    }
    /**
     * Decodes the given base64 encoded track from lavalink.
     * @param {string} track Base64 Encoded Track you got from the Lavalink API.
     * @memberof ShoukakuRest
     * @returns {Promise<Object>} The Lavalink Track details.
     */
    decode(track) {
        if (!track) throw new Error('Track cannot be null');
        return this.router.decodeTrack({ track }).get();
    }
    /**
     * Gets the status of the "RoutePlanner API" for this Lavalink node.
     * @memberof ShoukakuRest
     * @returns {Promise<Object>} Refer to `https://github.com/freyacodes/Lavalink/blob/master/IMPLEMENTATION.md#routeplanner-api`
     */
    getRoutePlannerStatus() {
        return this.router.routeplanner.status.get();
    }
    /**
     * Unmarks a failed IP in the "RoutePlanner API" on this Lavalink node.
     * @param {string} address The IP you want to unmark as failed.
     * @memberof ShoukakuRest
     * @returns {Promise<void>}
     */
    unmarkFailedAddress(address) {
        if (!address) throw new Error('Address cannot be null');
        return this.router.routeplanner.free.address.post({ body: { address } });
    }
    /**
     * Unmarks all the failed IP(s) in the "RoutePlanner API" on this Lavalink node.
     * @memberof ShoukakuRest
     * @returns {Promise<void>}
     */
    unmarkAllFailedAddress() {
        return this.router.routeplanner.free.all.post();
    }

    async fetch(url, { method, options }) {
        const headers = {
            'Authorization': this.auth,
            'User-Agent': this.userAgent
        };
        if (method === 'post') headers['Content-Type'] = 'application/json';
        const request = await Petitio(url)
            .method(method.toUpperCase())
            .headers(headers)
            .body(options?.body ?? null)
            .timeout(this.timeout)
            .send();
        if (request.status >= 200 && request.statusCode < 300) throw new Error(`Rest request failed with response code: ${request.statusCode}`);
        const body = request.body.toString('utf8');
        if (!body?.length) return;
        return JSON.parse(body);
    }
}
module.exports = ShoukakuRest; 
