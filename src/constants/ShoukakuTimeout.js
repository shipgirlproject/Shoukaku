class ShoukakuTimeout extends Error {
    constructor(message) {
        super(message);
        this.name = 'ShoukakuTimeout';
    }
}
module.exports = ShoukakuTimeout;