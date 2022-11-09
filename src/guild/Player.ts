import { EventEmitter } from 'events';
import { Node, VoiceChannelOptions } from '../node/Node';
import { mergeDefault } from '../Utils';
import { OPCodes, State } from '../Constants';
import { Connection } from './Connection';

export type TrackEndReason = 'FINISHED' | 'LOAD_FAILED' | 'STOPPED' | 'REPLACED' | 'CLEANUP';
export type Severity = 'COMMON' | 'SUSPICIOUS' | 'FAULT';
export type PlayerEventType = 'TrackStartEvent' | 'TrackEndEvent' | 'TrackExceptionEvent' | 'TrackStuckEvent' | 'WebSocketClosedEvent';

/**
 * Options when playing a new track
 */
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
    op: OPCodes.EVENT;
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
    op: OPCodes.PLAYER_UPDATE;
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
     * @param options.volume The volume to play audio at as a decimal
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
     * Emitted when the current playing track ends
     * @eventProperty
     */
    on(event: 'end', listener: (reason: TrackEndEvent) => void): this;
    /**
     * Emitted when the current playing track gets stuck due to an error
     * @eventProperty
     */
    on(event: 'stuck', listener: (data: TrackStuckEvent) => void): this;
    /**
     * Emitted when the current websocket connection is closed
     * @eventProperty
     */
    on(event: 'closed', listener: (reason: WebSocketClosedEvent) => void): this;
    /**
     * Emitted when a new track starts
     * @eventProperty
     */
    on(event: 'start', listener: (data: TrackStartEvent) => void): this;
    /**
     * Emitted when there is an error caused by the current playing track
     * @eventProperty
     */
    on(event: 'exception', listener: (reason: TrackExceptionEvent) => void): this;
    /**
     * Emitted when the library manages to resume the player
     * @eventProperty
     */
    on(event: 'resumed', listener: () => void): this;
    /**
     * Emitted when a playerUpdate even is recieved from Lavalink
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
 * Wrapper object around Lavalink
 */
export class Player extends EventEmitter {
    /**
     * Lavalink node this player is connected to
     */
    public node: Node;
    /**
     * Discort voice channel that this player is connected to
     */
    public readonly connection: Connection;
    /**
     * ID of current track
     */
    public track: string|null;
    /**
     * Pause status in current player
     */
    public paused: boolean;
    /**
     * Ping represents the number of milliseconds between heartbeat and ack. Could be `-1` if not connected
     */
    public ping: number;
    /**
     * Position in ms of current track
     */
    public position: number;
    /**
     * Filters on current track
     */
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

    /**
     * Move player to another node
     * @param name Name of node to move to
     * @returns The current player instance
     */
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

    /**
     * Play a new track
     * @param playable Options for playing this track
     * @returns The current player instance
     */
    public playTrack(playable: PlayOptions): Player {
        const payload: PlayPayload = {
            op: OPCodes.PLAY,
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

    /**
     * Stop the currently playing track
     * @returns The current player instance
     */
    public stopTrack(): Player {
        this.position = 0;
        this.node.queue.add({
            op: OPCodes.STOP,
            guildId: this.connection.guildId
        });

        return this;
    }

    /**
     * Pause or unpause the currently playing track
     * @param pause Boolean value to specify whether to pause or unpause the current bot user
     * @returns The current player instance
     */
    public setPaused(pause = true): Player {
        this.node.queue.add({
            op: OPCodes.PAUSE,
            guildId: this.connection.guildId,
            pause
        });

        this.paused = pause;
        return this;
    }

    /**
     * Seek to a specific time in the currently playing track
     * @param position Position to seek to in milliseconds
     * @returns The current player instance
     */
    public seekTo(position: number): Player {
        this.node.queue.add({
            op: OPCodes.SEEK,
            guildId: this.connection.guildId,
            position
        });

        return this;
    }

    /**
     * Change the volume of the currently playing track
     * @param volume Target volume as a decimal
     * @returns The current player instance
     */
    public setVolume(volume: number): Player {
        volume = Math.min(5, Math.max(0, volume));
        this.filters.volume = volume;
        this.updateFilters();

        return this;
    }

    /**
     * Change the equalizer settings applied to the currently playing track
     * @param bands An array of objects that conforms to the Bands type that define volumes at different frequencies
     * @returns The current player instance
     */
    public setEqualizer(bands: Band[]): Player {
        this.filters.equalizer = bands;
        this.updateFilters();

        return this;
    }

    /**
     * Change the karaoke settings applied to the currently playing track
     * @param karaoke An object that conforms to the KaraokeSettings type that defines a range of frequencies to mute
     * @returns The current player instance
     */
    public setKaraoke(karaoke?: KaraokeSettings): Player {
        this.filters.karaoke = karaoke|| null;
        this.updateFilters();

        return this;
    }

    /**
     * Change the timescale settings applied to the currently playing track
     * @param timescale An object that conforms to the TimescaleSettings type that defines the time signature to play the audio at
     * @returns The current player instance
     */
    public setTimescale(timescale?: TimescaleSettings): Player {
        this.filters.timescale = timescale || null;
        this.updateFilters();

        return this;
    }

    /**
     * Change the tremolo settings applied to the currently playing track
     * @param tremolo An object that conforms to the FreqSettings type that defines an ocillation in volume
     * @returns The current player instance
     */
    public setTremolo(tremolo?: FreqSettings): Player {
        this.filters.tremolo = tremolo || null;
        this.updateFilters();

        return this;
    }

    /**
     * Change the vibrato settings applied to the currently playing track
     * @param vibrato An object that conforms to the FreqSettings type that defines an ocillation in pitch
     * @returns The current player instance
     */
    public setVibrato(vibrato?: FreqSettings): Player {
        this.filters.vibrato = vibrato || null;
        this.updateFilters();

        return this;
    }

    /**
     * Change the rotation settings applied to the currently playing track
     * @param rotation An object that conforms to the RotationSettings type that defines the frequency of audio rotating round the listener
     * @returns The current player instance
     */
    public setRotation(rotation?: RotationSettings): Player {
        this.filters.rotation = rotation || null;
        this.updateFilters();

        return this;
    }

    /**
     * Change the distortion settings applied to the currently playing track
     * @param distortion An object that conforms to DistortionSettings that defines distortions in the audio
     * @returns The current player instance
     */
    public setDistortion(distortion: DistortionSettings): Player {
        this.filters.distortion = distortion || null;
        this.updateFilters();

        return this;
    }

    /**
     * Change the channel mix settings applied to the currently playing track
     * @param mix An object that conforms to ChannelMixSettings that defines how much the left and right channels affect each other (setting all factors to 0.5 causes both channels to get the same audio)
     * @returns The current player instance
     */
    public setChannelMix(mix: ChannelMixSettings): Player {
        this.filters.channelMix = mix || null;
        this.updateFilters();

        return this;
    }

    /**
     * Change the low pass settings applied to the currently playing track
     * @param pass An object that conforms to LowPassSettings that defines the amount of suppression on higher frequencies
     * @returns The current player instance
     */
    public setLowPass(pass: LowPassSettings): Player {
        this.filters.lowPass = pass || null;
        this.updateFilters();

        return this;
    }

    /**
     * Change the all filter settings applied to the currently playing track
     * @param options An object that conforms to FilterOptions that defines all filters to apply/modify
     * @returns The current player instance
     */
    public setFilters(options: FilterOptions): Player {
        this.filters = new Filters(options);
        this.updateFilters();

        return this;
    }

    /**
     * Clear all filters applied to the currently playing track
     * @returns The current player instance
     */
    public clearFilters(): Player {
        this.filters = new Filters();
        this.node.queue.add({
            op: OPCodes.FILTERS,
            guildId: this.connection.guildId
        });

        return this;
    }

    /**
     * Resume the current track
     * @param options An object that conforms to ResumeOptions that specify behavior on resuming
     * @returns The current player instance
     */
    public resume(options: ResumeOptions = {}): Player {
        this.updateFilters();
        if (this.track) {
            options = mergeDefault({ startTime: this.position, pause: this.paused }, options);
            this.playTrack({ track: this.track, options });
        }

        this.emit('resumed');
        return this;
    }

    /**
     * Update all filters via the filters operation
     * @internal
     */
    private updateFilters(): void {
        const { volume, equalizer, karaoke, timescale, tremolo, vibrato, rotation, distortion, channelMix, lowPass } = this.filters;
        this.node.queue.add({
            op: OPCodes.FILTERS,
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

    /**
     * Remove all event listeners on this instance
     * @internal
     */
    public clean(): void {
        this.removeAllListeners();
        this.reset();
    }

    /**
     * Reset the track, position and filters on this instance to defaults
     */
    public reset(): void {
        this.track = null;
        this.position = 0;
        this.filters = new Filters();
    }

    /**
     * Handle JSON data recieved from Lavalink
     * @param json JSON data from Lavalink
     * @internal
     */
    public onLavalinkMessage(json: any): void {
        if (json.op === OPCodes.PLAYER_UPDATE) {
            this.position = json.state.position;
            // ping property require lavalink >=3.5.1
            this.ping = json.state.ping ?? 0;
            this.emit('update', json);
        } else if (json.op === OPCodes.EVENT)
            this.onPlayerEvent(json);
        else {
            this.node.emit('debug', this.node.name, `[Player] -> [Node] : Unknown Message OP ${json.op} | Guild: ${this.connection.guildId}`);
        }
    }

    /**
     * Handle player events recieved from Lavalink
     * @param json JSON data from Lavalink
     * @internal
     */
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
