/**
  * ShoukakuTimeout, Timeout Error class of Shoukaku.
  * @class ShoukakuTimeout
  * @extends {Error}
  */
class ShoukakuTimeout extends Error {
    /**
     * @param message The Error Message
     */
    constructor(message) {
        super(message);
        this.name = 'ShoukakuTimeout';
    }
}
module.exports = ShoukakuTimeout;
