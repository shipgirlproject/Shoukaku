import { EventEmitter } from 'events';
import { Node, VoiceChannelOptions } from '../node/Node';
import { mergeDefault } from '../Utils';
import { OPCodes, State } from '../Constants';
import { Connection } from './Connection';
import { UpdatePlayerInfo, UpdatePlayerOptions } from '../node/Rest';

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
    public filters: FilterOptions;
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
        this.ping = 0;
        this.filters = {};
    }

    public get playerData(): UpdatePlayerInfo {
        return {
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: {
                encodedTrack: this.track,
                position: this.position,
                paused: this.paused,
                filters: this.filters,
                voice: this.connection.serverUpdateInfo,
                volume: this.filters.volume ?? 1
            }
        };
    }

    /**
     * Move player to another node
     * @param name Name of node to move to
     */
    public async move(name: string): Promise<void> {
        const node = this.node.manager.nodes.get(name);
        if (!node || node.name === this.node.name) return;
        if (node.state !== State.CONNECTED) throw new Error('The node you specified is not ready');
        await this.connection.destroyLavalinkPlayer();
        this.node.players.delete(this.connection.guildId);
        this.node = node;
        this.node.players.set(this.connection.guildId, this);
        await this.resume();
    }

    /**
     * Play a new track
     * @param playable Options for playing this track
     */
    public async playTrack(playable: PlayOptions): Promise<void> {
        const playerOptions = {
            encodedTrack: playable.track,
            pause: playable.options?.pause ?? false,
            position: playable.options?.startTime,
            endTime: playable.options?.endTime
        };
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            noReplace: playable.options?.noReplace ?? false,
            playerOptions
        });
        this.track = playable.track;
        this.paused = playable.options?.pause ?? false;
        this.position = playerOptions.position ?? 0;
    }

    /**
     * Stop the currently playing track
     */
    public async stopTrack(): Promise<void> {
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { encodedTrack: null }
        });
        this.position = 0;
    }

    /**
     * Pause or unpause the currently playing track
     * @param paused Boolean value to specify whether to pause or unpause the current bot user
     */
    public async setPaused(paused = true): Promise<void> {
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { paused }
        });
        this.paused = paused;
    }

    /**
     * Seek to a specific time in the currently playing track
     * @param position Position to seek to in milliseconds
     */
    public async seekTo(position: number): Promise<void> {
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { position }
        });
        this.position = position;
    }

    /**
     * Change the volume of the currently playing track
     * @param volume Target volume as a decimal
     */
    public async setVolume(volume: number): Promise<void> {
        volume = Math.min(5, Math.max(0, volume));
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { filters: { volume }}
        });
        this.filters.volume = volume;
    }

    /**
     * Change the equalizer settings applied to the currently playing track
     * @param equalizer An array of objects that conforms to the Bands type that define volumes at different frequencies
     */
    public async setEqualizer(equalizer: Band[]): Promise<void> {
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { filters: { equalizer }}
        });
        this.filters.equalizer = equalizer;
    }

    /**
     * Change the karaoke settings applied to the currently playing track
     * @param karaoke An object that conforms to the KaraokeSettings type that defines a range of frequencies to mute
     */
    public async setKaraoke(karaoke?: KaraokeSettings): Promise<void> {
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { filters: { karaoke }}
        });
        this.filters.karaoke = karaoke || null;
    }

    /**
     * Change the timescale settings applied to the currently playing track
     * @param timescale An object that conforms to the TimescaleSettings type that defines the time signature to play the audio at
     */
    public async setTimescale(timescale?: TimescaleSettings): Promise<void> {
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { filters: { timescale }}
        });
        this.filters.timescale = timescale || null;
    }

    /**
     * Change the tremolo settings applied to the currently playing track
     * @param tremolo An object that conforms to the FreqSettings type that defines an ocillation in volume
     */
    public async setTremolo(tremolo?: FreqSettings): Promise<void> {
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { filters: { tremolo }}
        });
        this.filters.tremolo = tremolo || null;
    }

    /**
     * Change the vibrato settings applied to the currently playing track
     * @param vibrato An object that conforms to the FreqSettings type that defines an ocillation in pitch
     */
    public async setVibrato(vibrato?: FreqSettings): Promise<void> {
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { filters: { vibrato }}
        });
        this.filters.vibrato = vibrato || null;
    }

    /**
     * Change the rotation settings applied to the currently playing track
     * @param rotation An object that conforms to the RotationSettings type that defines the frequency of audio rotating round the listener
     */
    public async setRotation(rotation?: RotationSettings): Promise<void> {
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { filters: { rotation }}
        });
        this.filters.rotation = rotation || null;
    }

    /**
     * Change the distortion settings applied to the currently playing track
     * @param distortion An object that conforms to DistortionSettings that defines distortions in the audio
     * @returns The current player instance
     */
    public async setDistortion(distortion: DistortionSettings): Promise<void> {
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { filters: { distortion }}
        });
        this.filters.distortion = distortion || null;
    }

    /**
     * Change the channel mix settings applied to the currently playing track
     * @param channelMix An object that conforms to ChannelMixSettings that defines how much the left and right channels affect each other (setting all factors to 0.5 causes both channels to get the same audio)
     */
    public async setChannelMix(channelMix: ChannelMixSettings): Promise<void> {
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { filters: { channelMix }}
        });
        this.filters.channelMix = channelMix || null;
    }

    /**
     * Change the low pass settings applied to the currently playing track
     * @param lowPass An object that conforms to LowPassSettings that defines the amount of suppression on higher frequencies
     */
    public async setLowPass(lowPass: LowPassSettings): Promise<void> {
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { filters: { lowPass }}
        });
        this.filters.lowPass = lowPass || null;
    }

    /**
     * Change the all filter settings applied to the currently playing track
     * @param filters An object that conforms to FilterOptions that defines all filters to apply/modify
     */
    public async setFilters(filters: FilterOptions): Promise<void> {
        await this.node.rest.updatePlayer({
            guildId: this.connection.guildId,
            sessionId: this.node.sessionId!,
            playerOptions: { filters }
        });
        this.filters = filters;
    }

    /**
     * Clear all filters applied to the currently playing track
     */
    public clearFilters(): Promise<void> {
        return this.setFilters({
            volume: 1,
            equalizer: [],
            karaoke: null,
            timescale: null,
            tremolo: null,
            vibrato: null,
            rotation: null,
            distortion: null,
            channelMix: null,
            lowPass: null,
        });
    }

    /**
     * If you want to update the whole player yourself, sends raw update player info to lavalink
     */
    public async update(updatePlayer: UpdatePlayerInfo): Promise<void> {
        const data = { ...updatePlayer, ...{ guildId: this.connection.guildId, sessionId: this.node.sessionId! }};
        await this.node.rest.updatePlayer(data);
        if (updatePlayer.playerOptions) {
            const options = updatePlayer.playerOptions;
            if (options.encodedTrack) this.track = options.encodedTrack;
            if (options.position) this.position = options.position;
            if (options.paused) this.paused = options.paused;
            if (options.filters) this.filters = options.filters;
        }
    }

    /**
     * Resume the current track
     * @param options An object that conforms to ResumeOptions that specify behavior on resuming
     */
    public async resume(options: ResumeOptions = {}): Promise<void> {
        await this.setFilters(this.filters);
        if (this.track && this.connection.sessionId) {
            await this.update(this.playerData);
            this.emit('resumed');
        }
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
        this.filters = {};
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
                if (this.track) this.track = json.encodedTrack;
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
