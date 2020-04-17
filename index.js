/**
 * Discord.JS Client
 * @external Client
 * @see {@link https://discord.js.org/#/docs/main/master/class/Client}
 */

/**
 * Discord.JS Guild
 * @external Guild
 * @see {@link https://discord.js.org/#/docs/main/master/class/Guild}
 */

/**
 * Node.js Event Emitter
 * @external EventEmitter
 * @see {@link https://nodejs.org/api/events.html}
 */

module.exports = {
    Shoukaku: require('./src/Shoukaku.js'),
    Constants: require('./src/constants/ShoukakuConstants.js'),
    version: require('./package.json').version
};
