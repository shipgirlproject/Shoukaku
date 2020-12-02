/**
 * Filters available for customization. See https://github.com/Frederikam/Lavalink/blob/dev/IMPLEMENTATION.md#using-filters
 * @class ShoukakuFilter
 */
class ShoukakuFilter {
    constructor(settings = {}) {
        const { volume, equalizer, karaoke, timescale, tremolo, vibrato } = settings;
        /**
         * The volume of this filter
         * @type {Number}
         */
        this.volume = volume || 1.0;
        /**
         * The equalizer bands set for this filter
         * @type {Array<ShoukakuConstants#EqualizerBand>}
         */
        this.equalizer = equalizer || [];
        /**
         * The karaoke settings set for this filter
         * @type {?ShoukakuConstants#KaraokeValue}
         */
        this.karaoke = karaoke || null;
        /**
         * The timescale settings set for this filter
         * @type {?ShoukakuConstants#TimescaleValue}
         */
        this.timescale = timescale || null;
        /**
         * The tremolo settings set for this filter
         * @type {?ShoukakuConstants#TremoloValue}
         */
        this.tremolo = tremolo || null;
        /**
         * The vibrato settings set for this filter
         * @type {?ShoukakuConstants#VibratoValue}
         */
        this.vibrato = vibrato || null;
    }
}

module.exports = ShoukakuFilter;