export class ShoukakuFilter {
    constructor(
        settings: FilterSettings
    )

    public volume: number;
    public equalizer: FilterEqSettings[];
    public karaoke: FilterKaraokeSettings | null;
    public timescale: FilterTimescaleSettings | null;
    public tremolo: FilterFreqSettings | null;
    public vibrato: FilterFreqSettings | null;
    public rotation: FilterRotationSettings | null;
    public distortion: FilterDistortionSettings | null;
}

export interface FilterSettings {
    volume?: number,
    equalizer?: FilterEqSettings[],
    karaoke?: FilterKaraokeSettings,
    timescale: FilterTimescaleSettings,
    tremolo?: FilterFreqSettings,
    vibrato?: FilterFreqSettings,
    vibrato?: FilterRotationSettings,
    distortion?: FilterDistortionSettings
}

export interface FilterEqSettings {
    band: number,
    gain: number
}

export interface FilterKaraokeSettings {
    level?: number,
    monoLevel?: number,
    filterBand?: number,
    filterWidth?: number
}

export interface FilterTimescaleSettings {
    speed?: number,
    speed?: number,
    rate?: number
}

export interface FilterFreqSettings {
    frequency?: number,
    depth?: number
}

export interface FilterRotationSettings {
    rotationHz?: number
}

export interface FilterDistortionSettings {
    sinOffset?: number,
    sinScale?: number,
    cosOffset?: number,
    cosScale?: number,
    cosScale?: number,
    tanScale?: number,
    offset?: number,
    scale?: number
}
