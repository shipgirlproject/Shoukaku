import { EventEmitter } from 'events';
import { Guild } from 'discord.js';
import { ShoukakuSocket } from '../node/ShoukakuSocket';
import { ShoukakuConnection } from './ShoukakuConnection';
import { ShoukakuFilter } from '../struct/ShoukakuFilter';
import { ShoukakuTrack } from '../Constants';

export class ShoukakuPlayer extends EventEmitter {
    constructor(
        node: ShoukakuSocket,
        guild: Guild
    );

    public connection: ShoukakuConnection;
    public track?: string | null;
    public paused: boolean;
    public position: number;
    public filters: ShoukakuFilter;

    public moveNode(name: string): ShoukakuPlayer;
    public playTrack(input: string | ShoukakuTrack, options: { noReplace: boolean, pause: boolean, startTime?: number | undefined, endTime: number | undefined }): ShoukakuPlayer;
    public stopTrack(): ShoukakuPlayer;
    public setPaused(pause: boolean): ShoukakuPlayer;
    public seekTo(position: number): ShoukakuPlayer;
    public setVolume(volume: number): ShoukakuPlayer;
    public setEqualizer(bands: { band: number, gain: number }[]): ShoukakuPlayer;
    public setKaraoke(values: { level: number, monoLevel: number, filterBand: number, filterWidth: number } | null): ShoukakuPlayer;
    public setTimescale(values: { speed: number, pitch: number, rate: number } | null): ShoukakuPlayer;
    public setTremolo(values: { frequency: number, depth: number } | null): ShoukakuPlayer;
    public setVibrato(values: { frequency: number, depth: number } | null): ShoukakuPlayer;
    public setRotation(values: { rotationHz: number } | null): ShoukakuPlayer;
    public setDistortion(values: { sinOffset: number, sinScale: number, cosOffset: number, cosScale: number, tanOffset: number, tanScale: number, offset: number, scale: number } | null): ShoukakuPlayer;
    public setFilters(settings: ShoukakuFilter): ShoukakuPlayer;
    public cleanFilters(): ShoukakuPlayer;
    public resume(): ShoukakuPlayer;
    private updateFilters(): void;
    protected reset(): void;
    protected _onLavalinkMessage(json: Object): void;
    private _onPlayerEvent(json: Object): void;
    private _onWebsocketClosedEvent(json: Object): void;
}

export interface ShoukakuPlayer {
    on(event: 'end', listener: (reason: Object) => void): this;
    on(event: 'closed', listener: (reason: Object) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'start', listener: (data: Object) => void): this;
    on(event: 'exception', listener: (reason: Object) => void): this;
    on(event: 'resumed', listener: () => void): this;
    on(event: 'update', listener: (data: Object) => void): this;
    once(event: 'end', listener: (reason: Object) => void): this;
    once(event: 'closed', listener: (reason: Object) => void): this;
    once(event: 'error', listener: (error: Error) => void): this;
    once(event: 'start', listener: (data: Object) => void): this;
    once(event: 'exception', listener: (reason: Object) => void): this;
    once(event: 'resumed', listener: () => void): this;
    once(event: 'update', listener: (data: Object) => void): this;
    off(event: 'end', listener: (reason: Object) => void): this;
    off(event: 'closed', listener: (reason: Object) => void): this;
    off(event: 'error', listener: (error: Error) => void): this;
    off(event: 'start', listener: (data: Object) => void): this;
    off(event: 'exception', listener: (reason: Object) => void): this;
    off(event: 'resumed', listener: () => void): this;
    off(event: 'update', listener: (data: Object) => void): this;
}
