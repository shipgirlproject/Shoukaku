const Fetch = require('node-fetch');
const Abort = require('abort-controller');
const Search = {
    'soundcloud': 'scsearch',
    'youtube': 'ytsearch'
};
const Success = ['TRACK_LOADED', 'PLAYLIST_LOADED', 'SEARCH_RESULT'];

class ShoukakuResolver {
    constructor(options) {

        Object.defineProperty(this, 'auth', { value: options.auth });

        this.host = options.host;
        this.timeout = options.timeout || 10000;
        this.url = `http://${options.host}:${options.port}/`;
    }

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
    
    async decode(track) {
        if (!track)
            throw new Error('Track cannot be null');
        const url = new URL(`${this.url}/decodetrack`);
        url.search = new URLSearchParams({ track });
        const data = await this._fetch(url.toString());
        return data;
    }

    _fetch(url) {
        const controller = new Abort();
        const timeout = setTimeout(() => controller.abort(), this.timeout);
        return Fetch(url, { headers: { Authorization: this.auth }, signal: controller.signal })
            .then((res) => {
                if (res.status !== 200) 
                    throw new Error(`Shouaku Resolver Failed. Error Code: ${res.status}`);
                return res.json();
            }, (error) => {
                if (error.name === 'AbortError') error = new Error(`Shouaku Resolver Failed. Failed to fetch this video in ${Math.round(this.timeout / 1000)}s`);
                throw error;
            })
            .finally(() => clearTimeout(timeout));
    }
}
module.exports = ShoukakuResolver;