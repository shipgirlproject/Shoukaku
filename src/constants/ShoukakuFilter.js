/**
 * Filters available for customization. See https://github.com/freyacodes/Lavalink/blob/dev/IMPLEMENTATION.md#using-filters
 * @class ShoukakuFilter
 */
class ShoukakuFilter {
    /**
     * @param {Object} [settings] settings to intialize this filter with
     * @param {Number} [settings.volume=1.0] volume of this filter
     * @param {Array<ShoukakuConstants#EqualizerBand>} [settings.equalizer=[]] equalizer of this filter
     * @param {ShoukakuConstants#KaraokeValue} [settings.karaoke] karaoke settings of this filter
     * @param {ShoukakuConstants#TimescaleValue} [settings.timescale] timescale settings of this filter
     * @param {ShoukakuConstants#TremoloValue} [settings.tremolo] tremolo settings of this filter
     * @param {ShoukakuConstants#VibratoValue} [settings.vibrato] vibrato settings of this filter
     * @param {ShoukakuConstants#RotationValue} [settings.rotation] rotation settings of this filter
     * @param {ShoukakuConstants#DistortionValue} [settings.distortion] distortion settings of this filter
     */
    constructor(settings = {}) {
        /**
         * The volume of this filter
         * @type {Number}
         */
        this.volume = settings.volume || 1.0;
        /**
         * The equalizer bands set for this filter
         * @type {Array<ShoukakuConstants#EqualizerBand>}
         */
        this.equalizer = settings.equalizer || [];
        /**
         * The karaoke settings set for this filter
         * @type {?ShoukakuConstants#KaraokeValue}
         */
        this.karaoke = settings.karaoke || null;
        /**
         * The timescale settings set for this filter
         * @type {?ShoukakuConstants#TimescaleValue}
         */
        this.timescale = settings.timescale || null;
        /**
         * The tremolo settings set for this filter
         * @type {?ShoukakuConstants#TremoloValue}
         */
        this.tremolo = settings.tremolo || null;
        /**
         * The vibrato settings set for this filter
         * @type {?ShoukakuConstants#VibratoValue}
         */
        this.vibrato = settings.vibrato || null;
        /**
         * The rotation settings set for this filter
         * @type {?ShoukakuConstants#RotationValue}
         */
        this.rotation = settings.rotation || null;
        /**
         * The distortion settings set for this filter
         * @type {?ShoukakuConstants#DistortionValue}
         */
        this.distortion = settings.distortion || null;
    }
}

module.exports = ShoukakuFilter;