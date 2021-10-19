import { FilterChannelMixSettings, FilterDistortionSettings, FilterEqSettings, FilterFreqSettings, FilterKaraokeSettings, FilterLowPassSettings, FilterRotationSettings, FilterSettings, FilterTimescaleSettings } from '..';

export class ShoukakuFilter {
    constructor(settings: FilterSettings);

    public volume: number;
    public equalizer: FilterEqSettings[];
    public karaoke: FilterKaraokeSettings | null;
    public timescale: FilterTimescaleSettings | null;
    public tremolo: FilterFreqSettings | null;
    public vibrato: FilterFreqSettings | null;
    public rotation: FilterRotationSettings | null;
    public distortion: FilterDistortionSettings | null;
    public channelMix: FilterChannelMixSettings | null;
    public lowPass: FilterLowPassSettings | null;
}
