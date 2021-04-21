const fetch = require('petitio');
const ShoukakuTimeout = require('../constants/ShoukakuTimeout.js');
const ShoukakuError = require('../constants/ShoukakuError.js');
const ShoukakuUtil = require('../util/ShoukakuUtil.js');
const ShoukakuTrackList = require('../constants/ShoukakuTrackList.js');

const Success = ['TRACK_LOADED', 'PLAYLIST_LOADED', 'SEARCH_RESULT'];
/**
 * ShoukakuRest, provides access to Lavalink REST API.
 * @class ShoukakuRest
 */
class ShoukakuRest {
    /**
     * @param {string} host Your node host / ip address of where the lavalink is hosted.
     * @param {string} port The Port Number of your lavalink instance.
     * @param {string} auth The authentication key you set on your lavalink config.
     * @param {string} userAgent User agent to use per request
     * @param {number} [timeout=15000] Timeout before a request times out.
     * @param {boolean} secure use secure protocol or no
     */
    constructor(host, port, auth, userAgent, timeout, secure) {
        /**
        * URL of the host used by this resolver instance.
        * @type {string}
        */
        this.url = `http${secure ? 's' : ''}://${host}:${port}`;
        /**
         * This Resolver Timeout before it decides to cancel the request.
         * @type {number}
         */
        this.timeout = timeout || 15000;

        Object.defineProperty(this, 'auth', { value: auth });
        Object.defineProperty(this, 'userAgent', { value: userAgent });
    }
    /**
    * Resolves a identifier into a lavalink track.
    * @param {string} identifier Anything you want for lavalink to search for
    * @param {string} [search] Either `youtube` or `soundcloud` or `youtubemusic`. If specified, resolve will return search results.
    * @memberof ShoukakuRest
    * @returns {Promise<null|ShoukakuTrackList>} The parsed data from Lavalink rest
    */
    async resolve(identifier, search) {
        if (!identifier) throw new ShoukakuError('Identifier cannot be null');
        if (search) identifier = `${ShoukakuUtil.searchType(search)}:${identifier}`;
        const data = await this.get(`/loadtracks?${new URLSearchParams({ identifier }).toString()}`);
        return Success.includes(data.loadType) ? new ShoukakuTrackList(data) : null;
    }
    /**
     * Decodes the given base64 encoded track from lavalink.
     * @param {string} track Base64 Encoded Track you got from the Lavalink API.
     * @memberof ShoukakuRest
     * @returns {Promise<Object>} The Lavalink Track details.
     */
    decode(track) {
        if (!track) throw new ShoukakuError('Track cannot be null');
        return this.get(`/decodetrack?${new URLSearchParams({ track }).toString()}`);
    }
    /**
     * Gets the estimated latency from the lavalink server
     * @memberof ShoukakuRest
     * @returns {Promise<number>} The "estimated" latency
     */
    async getLatency() {
        const now = Date.now();
        // since this is just a dummy way of checking ping for LL, well don't parse the result
        await this.get('/routeplanner/status', false);
        return Date.now() - now;
    }
    /**
     * Gets the status of the "RoutePlanner API" for this Lavalink node.
     * @memberof ShoukakuRest
     * @returns {Promise<Object>} Refer to `https://github.com/freyacodes/Lavalink/blob/master/IMPLEMENTATION.md#routeplanner-api`
     */
    getRoutePlannerStatus() {
        return this.get('/routeplanner/status');
    }
    /**
     * Unmarks a failed IP in the "RoutePlanner API" on this Lavalink node.
     * @param {string} address The IP you want to unmark as failed.
     * @memberof ShoukakuRest
     * @returns {Promise<number>} Request status code
     */
    unmarkFailedAddress(address) {
        return this.post('/routeplanner/free/address', { address });
    }
    /**
     * Unmarks all the failed IP(s) in the "RoutePlanner API" on this Lavalink node.
     * @memberof ShoukakuRest
     * @returns {Promise<number>} Request status code
     */
    unmarkAllFailedAddress() {
        return this.post('/routeplanner/free/all');
    }

    async get(endpoint, parse = true) {
        let res;
        try {
            res = await this.fetch(this.url + endpoint, { headers: { Authorization: this.auth } });
        } catch (error) {
            if (error.name !== 'AbortError') throw error;
            throw new ShoukakuTimeout(this.timeout);
        }
        if (res.statusCode !== 200) throw new ShoukakuError(`Rest request failed with response code: ${res.statusCode}`);
        if (!parse) return res.statusCode;
        return res.json();
    }

    async post(endpoint, body) {
        const options = {
            method: 'POST',
            headers: { Authorization: this.auth }
        };
        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        let res;
        try {
            res = await this.fetch(this.url + endpoint, options);
        } catch (error) {
            if (error.name !== 'AbortError') throw error;
            throw new ShoukakuTimeout(this.timeout);
        }
        if (res.statusCode !== 200) throw new ShoukakuError(`Rest request failed with response code: ${res.statusCode}`);
        return res.statusCode;
    }

    fetch(url, options) {
        const fetchOptions = options || {};

        if (!fetchOptions.headers) fetchOptions.headers = {};
        if (!('User-Agent' in fetchOptions.headers)) fetchOptions.headers['User-Agent'] = this.userAgent;

        return fetch(url)
            .method(fetchOptions?.method ?? 'GET')
            .headers(fetchOptions.headers)
            .body(fetchOptions?.body ?? null)
            .timeout(this.timeout)
            .send()
    }
}
module.exports = ShoukakuRest;
