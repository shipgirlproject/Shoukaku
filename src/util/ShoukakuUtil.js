const ShoukakuError = require('../constants/ShoukakuError.js');
const SearchTypes = { 'soundcloud': 'scsearch', 'youtube': 'ytsearch' };
/**
 * Misc utilities used by Shoukaku
 * @class ShoukakuUtil
 */
class ShoukakuUtil {
    static mergeDefault(def, given) {
        if (!given) return def;
        const defaultKeys = Object.keys(def);
        for (const key of defaultKeys) {
            if (def[key] === null) {
                if (!given[key]) throw new ShoukakuError(`${key} was not found from the given options.`);
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
        if (!result) throw new ShoukakuError('This search type is not supported');
        return result;
    }

    static websocketSend(ws, payload) {
        return new Promise(resolve => ws.send(payload, () => resolve()));
    }
}
module.exports = ShoukakuUtil;
