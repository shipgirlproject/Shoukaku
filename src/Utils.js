const SearchTypes = { 'soundcloud': 'scsearch', 'youtube': 'ytsearch', 'youtubemusic': 'ytmsearch' };

class Utils {
    static mergeDefault(def, given) {
        if (!given) return def;
        const defaultKeys = Object.keys(def);
        for (const key of defaultKeys) {
            if (def[key] === null) {
                if (!given[key]) throw new Error(`${key} was not found from the given options.`);
            }
            if (given[key] === null || given[key] === undefined) given[key] = def[key];
        }
        for (const key in defaultKeys) {
            if (defaultKeys.includes(key)) continue;
            delete given[key];
        }
        return given;
    }

    static searchType(string) {
        const result = SearchTypes[string];
        if (!result) throw new Error('This search type is not supported');
        return result;
    }

    static wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
module.exports = Utils;
