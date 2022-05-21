import { EventEmitter } from 'events';
import { Node, VoiceChannelOptions } from '../node/Node';
import { mergeDefault } from '../Utils';
import { State } from '../Constants';
import { Connection } from './Connection';

export type TrackEndReason = 'FINISHED' | 'LOAD_FAILED' | 'STOPPED' | 'REPLACED' | 'CLEANUP';
export type Severity = 'COMMON' | 'SUSPICIOUS' | 'FAULT';
export type PlayerEventType = 'TrackStartEvent' | 'TrackEndEvent' | 'TrackExceptionEvent' | 'TrackStuckEvent' | 'WebSocketClosedEvent';

export interface PlayOptions {
    track: string;
    options?: {
        noReplace?: boolean;
        pause?: boolean;
        startTime?: number;
        endTime?: number;
    }
}

export interface PlayPayload {
    op: string;
    guildId: string;
    track: string;
    noReplace: boolean;
    pause: boolean;
    startTime?: number;
    endTime?: number;
}

export interface ResumeOptions {
    noReplace?: boolean;
    pause?: boolean;
    startTime?: number;
    endtime?: number;
}

export interface Band {
    band: number;
    gain: number;
}

export interface KaraokeSettings {
    level?: number;
    monoLevel?: number;
    filterBand?: number;
    filterWidth?: number;
  }

export interface TimescaleSettings {
    speed?: number;
    pitch?: number;
    rate?: number;
  }

export interface FreqSettings {
    frequency?: number;
    depth?: number;
  }

export interface RotationSettings {
    rotationHz?: number;
  }

export interface DistortionSettings {
    sinOffset?: number;
    sinScale?: number;
    cosOffset?: number;
    cosScale?: number;
    tanOffset?: number;
    tanScale?: number;
    offset?: number;
    scale?: number;
  }

export interface ChannelMixSettings {
    leftToLeft?: number;
    leftToRight?: number;
    rightToLeft?: number;
    rightToRight?: number;
  }

export interface LowPassSettings {
    smoothing?: number
  }

export interface PlayerEvent {
    op: 'event';
    type: PlayerEventType;
    guildId: string;
  }

export interface Exception {
    severity: Severity;
    message: string;
    cause: string;
  }

export interface TrackStartEvent extends PlayerEvent {
    type: 'TrackStartEvent';
    track: string;
  }

export interface TrackEndEvent extends PlayerEvent {
    type: 'TrackEndEvent';
    track: string;
    reason: TrackEndReason;
  }

export interface TrackStuckEvent extends PlayerEvent {
    type: 'TrackStuckEvent';
    track: string;
    thresholdMs: number;
  }

export interface TrackExceptionEvent extends PlayerEvent {
    type: 'TrackExceptionEvent';
    exception?: Exception;
    error: string;
  }

export interface TrackStuckEvent extends PlayerEvent {
    type: 'TrackStuckEvent';
    thresholdMs: number;
  }

export interface WebSocketClosedEvent extends PlayerEvent {
    type: 'WebSocketClosedEvent';
    code: number;
    byRemote: boolean;
    reason: string;
}

export interface PlayerUpdate {
    op: 'playerUpdate';
    state: {
      connected: boolean;
      position?: number;
      time: number;
    };
    guildId: string;
}

export interface FilterOptions {
    volume?: number;
    equalizer?: Band[];
    karaoke?: KaraokeSettings|null;
    timescale?: TimescaleSettings|null;
    tremolo?: FreqSettings|null;
    vibrato?: FreqSettings|null;
    rotation?: RotationSettings|null;
    distortion?: DistortionSettings|null;
    channelMix?: ChannelMixSettings|null;
    lowPass?: LowPassSettings|null;
}

/**
 * Lavalink filters
 */
export class Filters {
    public volume: number;
    public equalizer: Band[];
    public karaoke: KaraokeSettings|null;
    public timescale: TimescaleSettings|null;
    public tremolo: FreqSettings|null;
    public vibrato: FreqSettings|null;
    public rotation: RotationSettings|null;
    public distortion: DistortionSettings|null;
    public channelMix: ChannelMixSettings|null;
    public lowPass: LowPassSettings|null;
    /**
     * Options to initialize this filters instance with
     * @param options.volume Number defining the volume to play audio at
     * @param options.equalizer An array of objects that conforms to the Bands type that define volumes at different frequencies
     * @param options.karaoke An object that conforms to the KaraokeSettings type that defines a range of frequencies to mute
     * @param options.timescale An object that conforms to the TimescaleSettings type that defines the time signature to play the audio at
     * @param options.tremolo An object that conforms to the FreqSettings type that defines an ocillation in volume
     * @param options.vibrato An object that conforms to the FreqSettings type that defines an ocillation in pitch
     * @param options.rotation An object that conforms to the RotationSettings type that defines the frequency of audio rotating round the listener
     * @param options.distortion An object that conforms to DistortionSettings that defines distortions in the audio
     * @param options.channelMix An object that conforms to ChannelMixSettings that defines how much the left and right channels affect each other (setting all factors to 0.5 causes both channels to get the same audio)
     * @param options.lowPass An object that conforms to LowPassSettings that defines the amount of suppression on higher frequencies
     */
    constructor(options: FilterOptions = {}) {
        this.volume = options.volume ?? 1.0;
        this.equalizer = options.equalizer || [];
        this.karaoke = options.karaoke || null;
        this.timescale = options.timescale || null;
        this.tremolo = options.tremolo || null;
        this.vibrato = options.vibrato || null;
        this.rotation = options.rotation || null;
        this.distortion = options.distortion || null;
        this.channelMix = options.channelMix || null;
        this.lowPass = options.lowPass || null;
    }
}

export declare interface Player {
    /**
     * Emmited when the current playing track ends
     * @eventProperty
     */
    on(event: 'end', listener: (reason: TrackEndEvent) => void): this;
    /**
     * Emmited when the current playing track gets stuck due to an error
     * @eventProperty
     */
    on(event: 'stuck', listener: (data: TrackStuckEvent) => void): this;
    /**
     * Emmited when the current websocket connection is closed
     * @eventProperty
     */
    on(event: 'closed', listener: (reason: WebSocketClosedEvent) => void): this;
    /**
     * Emmited when a new track starts
     * @eventProperty
     */
    on(event: 'start', listener: (data: TrackStartEvent) => void): this;
    /**
     * Emmited when there is an error caused by the current playing track
     * @eventProperty
     */
    on(event: 'exception', listener: (reason: TrackExceptionEvent) => void): this;
    /**
     * Emmited when the current playing track ends
     * @eventProperty
     */
    on(event: 'resumed', listener: () => void): this;
    /**
     * Emmited when a playerUpdate even is recieved from Lavalink
     * @eventProperty
     */
    on(event: 'update', listener: (data: PlayerUpdate) => void): this;
    once(event: 'end', listener: (reason: TrackEndEvent) => void): this;
    once(event: 'stuck', listener: (data: TrackStuckEvent) => void): this;
    once(event: 'closed', listener: (reason: WebSocketClosedEvent) => void): this;
    once(event: 'start', listener: (data: TrackStartEvent) => void): this;
    once(event: 'exception', listener: (reason: TrackExceptionEvent) => void): this;
    once(event: 'resumed', listener: () => void): this;
    once(event: 'update', listener: (data: PlayerUpdate) => void): this;
    off(event: 'end', listener: (reason: TrackEndEvent) => void): this;
    off(event: 'stuck', listener: (data: TrackStuckEvent) => void): this;
    off(event: 'closed', listener: (reason: WebSocketClosedEvent) => void): this;
    off(event: 'start', listener: (data: TrackStartEvent) => void): this;
    off(event: 'exception', listener: (reason: TrackExceptionEvent) => void): this;
    off(event: 'resumed', listener: () => void): this;
    off(event: 'update', listener: (data: PlayerUpdate) => void): this;
}

/**
 * Represents a wrapper object around Lavalink
 */
export class Player extends EventEmitter {
    public node: Node;
    public readonly connection: Connection;
    public track: string|null;
    public paused: boolean;
    public position: number;
    public filters: Filters;
    /**
     * @param node An instance of Node (Lavalink API wrapper)
     * @param options.guildId Guild ID in which voice channel to connect to is located
     * @param options.shardId Shard ID in which the guild exists
     * @param options.channelId Channel ID of voice channel to connect to
     * @param options.deaf Optional boolean value to specify whether to deafen the current bot user
     * @param options.mute Optional boolean value to specify whether to mute the current bot user
     */
    constructor(node: Node, options: VoiceChannelOptions) {
        super();
        this.node = node;
        this.connection = new Connection(this, options);
        this.track = null;
        this.paused = false;
        this.position = 0;
        this.filters = new Filters();
    }

    public move(name: string): Player {
        const node = this.node.manager.nodes.get(name);
        if (!node || node.name === this.node.name) return this;
        if (node.state !== State.CONNECTED) throw new Error('The node you specified is not ready');
        this.connection.destroyLavalinkPlayer();
        this.node.players.delete(this.connection.guildId);
        this.node = node;
        this.node.players.set(this.connection.guildId, this);
        this.connection.resendServerUpdate();
        this.resume();
        return this;
    }

    public playTrack(playable: PlayOptions): Player {
        const payload: PlayPayload = {
            op: 'play',
            guildId: this.connection.guildId,
            track: playable.track,
            noReplace: playable.options?.noReplace ?? true,
            pause: playable.options?.pause ?? false
        };
        if (playable.options?.startTime) payload.startTime = playable.options.startTime;
        if (playable.options?.endTime) payload.endTime = playable.options.startTime;
        this.node.queue.add(payload);
        this.track = playable.track;
        this.paused = playable.options?.pause ?? false;
        this.position = 0;
        return this;
    }

    public stopTrack(): Player {
        this.position = 0;
        this.node.queue.add({
            op: 'stop',
            guildId: this.connection.guildId
        });
        return this;
    }

    public setPaused(pause = true): Player {
        this.node.queue.add({
            op: 'pause',
            guildId: this.connection.guildId,
            pause
        });
        this.paused = pause;
        return this;
    }

    public seekTo(position: number): Player {
        this.node.queue.add({
            op: 'seek',
            guildId: this.connection.guildId,
            position
        });
        return this;
    }

    public setVolume(volume: number): Player {
        volume = Math.min(5, Math.max(0, volume));
        this.filters.volume = volume;
        this.updateFilters();
        return this;
    }

    public setEqualizer(bands: Band[]): Player {
        this.filters.equalizer = bands;
        this.updateFilters();
        return this;
    }

    public setKaraoke(karaoke?: KaraokeSettings): Player {
        this.filters.karaoke = karaoke|| null;
        this.updateFilters();
        return this;
    }

    public setTimescale(timescale?: TimescaleSettings): Player {
        this.filters.timescale = timescale || null;
        this.updateFilters();
        return this;
    }

    public setTremolo(tremolo?: FreqSettings): Player {
        this.filters.tremolo = tremolo || null;
        this.updateFilters();
        return this;
    }

    public setVibrato(vibrato?: FreqSettings): Player {
        this.filters.vibrato = vibrato || null;
        this.updateFilters();
        return this;
    }

    public setRotation(rotation?: RotationSettings): Player {
        this.filters.rotation = rotation || null;
        this.updateFilters();
        return this;
    }

    public setDistortion(distortion: DistortionSettings): Player {
        this.filters.distortion = distortion || null;
        this.updateFilters();
        return this;
    }

    public setChannelMix(mix: ChannelMixSettings): Player {
        this.filters.channelMix = mix || null;
        this.updateFilters();
        return this;
    }

    public setLowPass(pass: LowPassSettings): Player {
        this.filters.lowPass = pass || null;
        this.updateFilters();
        return this;
    }

    public setFilters(options: FilterOptions): Player {
        this.filters = new Filters(options);
        this.updateFilters();
        return this;
    }

    public clearFilters(): Player {
        this.filters = new Filters();
        this.node.queue.add({
            op: 'filters',
            guildId: this.connection.guildId
        });
        return this;
    }

    public resume(options: ResumeOptions = {}): Player {
        this.updateFilters();
        if (this.track) {
            options = mergeDefault({ startTime: this.position, pause: this.paused }, options);
            this.playTrack({ track: this.track, options });
        }
        this.emit('resumed');
        return this;
    }

    private updateFilters(): void {
        const { volume, equalizer, karaoke, timescale, tremolo, vibrato, rotation, distortion, channelMix, lowPass } = this.filters;
        this.node.queue.add({
            op: 'filters',
            guildId: this.connection.guildId,
            volume,
            equalizer,
            karaoke,
            timescale,
            tremolo,
            vibrato,
            rotation,
            distortion,
            channelMix,
            lowPass
        });
    }

    public clean(): void {
        this.removeAllListeners();
        this.reset();
    }

    public reset(): void {
        this.track = null;
        this.position = 0;
        this.filters = new Filters();
    }

    public onLavalinkMessage(json: any): void {
        if (json.op === 'playerUpdate') {
            this.position = json.state.position;
            this.emit('update', json);
        } else if (json.op === 'event')
            this.onPlayerEvent(json);
        else
            this.node.emit('debug', this.node.name, `[Player] -> [Node] : Unknown Message OP ${json.op} | Guild: ${this.connection.guildId}`);
    }

    private onPlayerEvent(json: any): void {
        switch (json.type) {
        case 'TrackStartEvent':
            this.position = 0;
            this.emit('start', json);
            break;
        case 'TrackEndEvent':
            this.emit('end', json);
            break;
        case 'TrackStuckEvent':
            this.emit('stuck', json);
            break;
        case 'TrackExceptionEvent':
            this.emit('exception', json);
            break;
        case 'WebSocketClosedEvent':
            if (!this.connection.reconnecting) {
                if (!this.connection.moved)
                    this.emit('closed', json);
                else
                    this.connection.moved = false;
            }
            break;
        default:
            this.node.emit(
                'debug',
                this.node.name,
                `[Player] -> [Node] : Unknown Player Event Type ${json.type} | Guild: ${this.connection.guildId}`
            );
        }
    }
}
