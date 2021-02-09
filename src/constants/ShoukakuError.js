/**
  * @class ShoukakuError
  * @extends {Error}
  */
class ShoukakuError extends Error {
    /**
     * @param message The error message
     */
    constructor(message) {
        super(message);
        this.name = 'ShoukakuError';
    }
}
module.exports = ShoukakuError;
