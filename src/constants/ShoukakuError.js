class ShoukakuError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ShoukakuError';
    }
}
module.exports = ShoukakuError;