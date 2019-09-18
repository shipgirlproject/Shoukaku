/**
  * ShoukakuError. Extended Error class.
  * @class ShoukakuError
  * @extends {Error}
  */
class ShoukakuError extends Error {
    /**
     * @param message The Error Message
     */
    constructor(message) {
        super(message);
        this.name = 'ShoukakuError';
    }
}
module.exports = ShoukakuError;
