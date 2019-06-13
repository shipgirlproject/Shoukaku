exports.ShoukakuOptions = {
    resumable: false,
    resumableTimeout: 30,
    resumekey: 'resumable',
    reconnectInterval: 10000,
    reconnectTries: 2,
    handleNodeDisconnects: true
};

exports.ShoukakuNodeObject = {
    host: null,
    port: null,
    auth: null
};

exports.ShoukakuBuildData = {
    id: null,
    shardCount: 1
};