module.exports = {
    Shoukaku: require('./src/Shoukaku.js'),
    Utils: require('./src/Utils.ts'),
    ShoukakuConnection: require('./src/guild/ShoukakuConnection.js'),
    ShoukakuPlayer: require('./src/guild/ShoukakuPlayer.js'),
    ShoukakuRest: require('./src/node/ShoukakuRest.js'),
    ShoukakuSocket: require('./src/node/ShoukakuSocket.js'),
    ShoukakuFilter: require('./src/struct/ShoukakuFilter.js'),
    ShoukakuStats: require('./src/struct/ShoukakuStats.js'),
    ShoukakuTrack: require('./src/struct/ShoukakuTrack.js'),
    ShoukakuTrackList: require('./src/struct/ShoukakuTrackList.js'),
    Constants: require('./src/Constants.js'),
    Libraries: require('./src/libraries/Libraries.js'),
    version: require('./package.json').version
};
