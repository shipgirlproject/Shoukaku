import { EventEmitter } from 'events';
import { Node } from '../node/Node';
import { Connection } from './Connection';
import { OpCodes, State, ShoukakuDefaults } from '../Constants';
import { Exception, Track, UpdatePlayerInfo, UpdatePlayerOptions } from '../node/Rest';

export type TrackEndReason = 'finished' | 'loadFailed' | 'stopped' | 'replaced' | 'cleanup';
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
        volume?: number;
    }
}

export interface ResumeOptions {
    noReplace?: boolean;
    pause?: boolean;
    startTime?: number;
    endTime?: number;
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
    op: OpCodes.EVENT;
    type: PlayerEventType;
    guildId: string;
}

export interface TrackStartEvent extends PlayerEvent {
    type: 'TrackStartEvent';
    track: Track;
}

export interface TrackEndEvent extends PlayerEvent {
    type: 'TrackEndEvent';
    track: Track;
    reason: TrackEndReason;
}

export interface TrackStuckEvent extends PlayerEvent {
    type: 'TrackStuckEvent';
    track: Track;
    thresholdMs: number;
}

export interface TrackExceptionEvent extends PlayerEvent {
    type: 'TrackExceptionEvent';
    exception: Exception;
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
    op: OpCodes.PLAYER_UPDATE;
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
    on(event: 'resumed', listener: (player: Player) => void): this;
    /**
     * Emitted when a playerUpdate even is received from Lavalink
     * @eventProperty
     */
    on(event: 'update', listener: (data: PlayerUpdate) => void): this;
    once(event: 'end', listener: (reason: TrackEndEvent) => void): this;
    once(event: 'stuck', listener: (data: TrackStuckEvent) => void): this;
    once(event: 'closed', listener: (reason: WebSocketClosedEvent) => void): this;
    once(event: 'start', listener: (data: TrackStartEvent) => void): this;
    once(event: 'exception', listener: (reason: TrackExceptionEvent) => void): this;
    once(event: 'resumed', listener: (player: Player) => void): this;
    once(event: 'update', listener: (data: PlayerUpdate) => void): this;
    off(event: 'end', listener: (reason: TrackEndEvent) => void): this;
    off(event: 'stuck', listener: (data: TrackStuckEvent) => void): this;
    off(event: 'closed', listener: (reason: WebSocketClosedEvent) => void): this;
    off(event: 'start', listener: (data: TrackStartEvent) => void): this;
    off(event: 'exception', listener: (reason: TrackExceptionEvent) => void): this;
    off(event: 'resumed', listener: (player: Player) => void): this;
    off(event: 'update', listener: (data: PlayerUpdate) => void): this;
}

/**
 * Wrapper object around Lavalink
 */
export class Player extends EventEmitter {
    /**
     * GuildId of this player
     */
    public readonly guildId: string;
    /**
     * Lavalink node this player is connected to
     */
    public node: Node;
    /**
     * ID of current track
     */
    public track: string|null;
    /**
     * Global volume of the player
     */
    public volume: number;
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
     * @param connection An instance of connection class
     */
    constructor(guildId: string, node: Node) {
        super();
        this.guildId = guildId;
        this.node = node;
        this.track = null;
        this.volume = 100;
        this.paused = false;
        this.position = 0;
        this.ping = 0;
        this.filters = {};
    }

    public get playerData(): UpdatePlayerInfo {
        const connection = this.node.manager.connections.get(this.guildId)!;
        return {
            guildId: this.guildId,
            playerOptions: {
                encodedTrack: this.track,
                position: this.position,
                paused: this.paused,
                filters: this.filters,
                voice: {
                    token: connection.serverUpdate!.token,
                    endpoint: connection.serverUpdate!.endpoint,
                    sessionId: connection.sessionId!
                },
                volume: this.volume
            }
        };
    }

    /**
     * Move player to another node
     * @param name? Name of node to move to, or the default ideal node
     * @returns true if the player was moved, false if not
     */
    public async movePlayer(name?: string): Promise<boolean> {
        const connection = this.node.manager.connections.get(this.guildId)!;
        const node = this.node.manager.nodes.get(name!) || this.node.manager.options.nodeResolver(this.node.manager.nodes, connection);
        if (!node && ![ ...this.node.manager.nodes.values() ].some(node => node.state === State.CONNECTED))
            throw new Error('No available nodes to move to');
        if (!node || node.name === this.node.name || node.state !== State.CONNECTED) return false;
        let lastNode = this.node.manager.nodes.get(this.node.name);
        if (!lastNode || lastNode.state !== State.CONNECTED)
            lastNode = ShoukakuDefaults.nodeResolver(this.node.manager.nodes, connection);
        await this.destroyPlayer();
        try {
            this.node = node;
            await this.resumePlayer();
            return true;
        } catch (error) {
            this.node = lastNode!;
            await this.resumePlayer();
            return false;
        }
    }

    /**
     * Destroys the player in remote lavalink side
     */
    public async destroyPlayer(): Promise<void> {
        await this.node.rest.destroyPlayer(this.guildId);
    }

    /**
     * Play a new track
     * @param playable Options for playing this track
     */
    public async playTrack(playable: PlayOptions): Promise<void> {
        const playerOptions: UpdatePlayerOptions = {
            encodedTrack: playable.track
        };
        if (playable.options) {
            const { pause, startTime, endTime, volume } = playable.options;
            if (pause) playerOptions.paused = pause;
            if (startTime) playerOptions.position = startTime;
            if (endTime) playerOptions.endTime = endTime;
            if (volume) playerOptions.volume = volume;
        }
        this.track = playable.track;
        if (playerOptions.paused) this.paused = playerOptions.paused;
        if (playerOptions.position) this.position = playerOptions.position;
        if (playerOptions.volume) this.volume = playerOptions.volume;
        await this.node.rest.updatePlayer({
            guildId: this.guildId,
            noReplace: playable.options?.noReplace ?? false,
            playerOptions
        });
    }

    /**
     * Stop the currently playing track
     */
    public async stopTrack(): Promise<void> {
        this.position = 0;
        await this.node.rest.updatePlayer({
            guildId: this.guildId,
            playerOptions: { encodedTrack: null }
        });

    }

    /**
     * Pause or unpause the currently playing track
     * @param paused Boolean value to specify whether to pause or unpause the current bot user
     */
    public async setPaused(paused = true): Promise<void> {
        this.paused = paused;
        await this.node.rest.updatePlayer({
            guildId: this.guildId,
            playerOptions: { paused }
        });
    }

    /**
     * Seek to a specific time in the currently playing track
     * @param position Position to seek to in milliseconds
     */
    public async seekTo(position: number): Promise<void> {
        this.position = position;
        await this.node.rest.updatePlayer({
            guildId: this.guildId,
            playerOptions: { position }
        });
    }

    /**
     * Sets the global volume of the player
     * @param volume Target volume 0-1000
     */
    public async setGlobalVolume(volume: number): Promise<void> {
        this.volume = volume;
        await this.node.rest.updatePlayer({
            guildId: this.guildId,
            playerOptions: { volume: this.volume }
        });
    }

    /**
     * Sets the filter volume of the player
     * @param volume Target volume 0.0-5.0
     */
    public async setFilterVolume(volume: number):  Promise<void> {
        this.filters.volume = volume;
        await this.setFilters(this.filters);
    }
    /**
     * Change the equalizer settings applied to the currently playing track
     * @param equalizer An array of objects that conforms to the Bands type that define volumes at different frequencies
     */
    public async setEqualizer(equalizer: Band[]): Promise<void> {
        this.filters.equalizer = equalizer;
        await this.setFilters(this.filters);

    }

    /**
     * Change the karaoke settings applied to the currently playing track
     * @param karaoke An object that conforms to the KaraokeSettings type that defines a range of frequencies to mute
     */
    public async setKaraoke(karaoke?: KaraokeSettings): Promise<void> {
        this.filters.karaoke = karaoke || null;
        await this.setFilters(this.filters);
    }

    /**
     * Change the timescale settings applied to the currently playing track
     * @param timescale An object that conforms to the TimescaleSettings type that defines the time signature to play the audio at
     */
    public async setTimescale(timescale?: TimescaleSettings): Promise<void> {
        this.filters.timescale = timescale || null;
        await this.setFilters(this.filters);
    }

    /**
     * Change the tremolo settings applied to the currently playing track
     * @param tremolo An object that conforms to the FreqSettings type that defines an oscillation in volume
     */
    public async setTremolo(tremolo?: FreqSettings): Promise<void> {
        this.filters.tremolo = tremolo || null;
        await this.setFilters(this.filters);
    }

    /**
     * Change the vibrato settings applied to the currently playing track
     * @param vibrato An object that conforms to the FreqSettings type that defines an oscillation in pitch
     */
    public async setVibrato(vibrato?: FreqSettings): Promise<void> {
        this.filters.vibrato = vibrato || null;
        await this.setFilters(this.filters);
    }

    /**
     * Change the rotation settings applied to the currently playing track
     * @param rotation An object that conforms to the RotationSettings type that defines the frequency of audio rotating round the listener
     */
    public async setRotation(rotation?: RotationSettings): Promise<void> {
        this.filters.rotation = rotation || null;
        await this.setFilters(this.filters);
    }

    /**
     * Change the distortion settings applied to the currently playing track
     * @param distortion An object that conforms to DistortionSettings that defines distortions in the audio
     * @returns The current player instance
     */
    public async setDistortion(distortion: DistortionSettings): Promise<void> {
        this.filters.distortion = distortion || null;
        await this.setFilters(this.filters);
    }

    /**
     * Change the channel mix settings applied to the currently playing track
     * @param channelMix An object that conforms to ChannelMixSettings that defines how much the left and right channels affect each other (setting all factors to 0.5 causes both channels to get the same audio)
     */
    public async setChannelMix(channelMix: ChannelMixSettings): Promise<void> {
        this.filters.channelMix = channelMix || null;
        await this.setFilters(this.filters);
    }

    /**
     * Change the low pass settings applied to the currently playing track
     * @param lowPass An object that conforms to LowPassSettings that defines the amount of suppression on higher frequencies
     */
    public async setLowPass(lowPass: LowPassSettings): Promise<void> {
        this.filters.lowPass = lowPass || null;
        await this.setFilters(this.filters);
    }

    /**
     * Change the all filter settings applied to the currently playing track
     * @param filters An object that conforms to FilterOptions that defines all filters to apply/modify
     */
    public async setFilters(filters: FilterOptions): Promise<void> {
        this.filters = filters;
        await this.node.rest.updatePlayer({
            guildId: this.guildId,
            playerOptions: { filters }
        });
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
     * Resumes the current track
     * @param options An object that conforms to ResumeOptions that specify behavior on resuming
     */
    public async resumePlayer(options: ResumeOptions = {}): Promise<void> {
        const data = this.playerData;
        if (options.noReplace) data.noReplace = options.noReplace;
        if (options.startTime) data.playerOptions.position = options.startTime;
        if (options.endTime) data.playerOptions.position;
        if (options.pause) data.playerOptions.paused = options.pause;
        await this.updatePlayer(data);
        this.emit('resumed', this);
    }

    /**
     * If you want to update the whole player yourself, sends raw update player info to lavalink
     */
    public async updatePlayer(updatePlayer: UpdatePlayerInfo): Promise<void> {
        const data = { ...updatePlayer, ...{ guildId: this.guildId, sessionId: this.node.sessionId! }};
        await this.node.rest.updatePlayer(data);
        if (updatePlayer.playerOptions) {
            const options = updatePlayer.playerOptions;
            if (options.encodedTrack) this.track = options.encodedTrack;
            if (options.position) this.position = options.position;
            if (options.paused) this.paused = options.paused;
            if (options.filters) this.filters = options.filters;
            if (options.volume) this.volume = options.volume;
        }
    }

    /**
     * Cleans this player instance
     * @internal
     */
    public clean(): void {
        this.removeAllListeners();
        this.track = null;
        this.volume = 100;
        this.position = 0;
        this.filters = {};
    }

    /**
     * Sends server update to lavalink
     * @internal
     */
    public async sendServerUpdate(connection: Connection): Promise<void> {
        const playerUpdate = {
            guildId: this.guildId,
            playerOptions: {
                voice: {
                    token: connection.serverUpdate!.token,
                    endpoint: connection.serverUpdate!.endpoint,
                    sessionId: connection.sessionId!
                }
            }
        };
        await this.node.rest.updatePlayer(playerUpdate);
    }

    /**
     * Handle player update data
     */
    public onPlayerUpdate(json: { state: { position: number, ping: number } }): void {
        const { position, ping } = json.state;
        this.position = position;
        this.ping = ping;
        this.emit('update', json);
    }

    /**
     * Handle player events received from Lavalink
     * @param json JSON data from Lavalink
     * @internal
     */
    public onPlayerEvent(json: { type: string, track: Track }): void {
        switch (json.type) {
            case 'TrackStartEvent':
                if (this.track) this.track = json.track.encoded;
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
                this.emit('closed', json);
                break;
            default:
                this.node.emit(
                    'debug',
                    this.node.name,
                    `[Player] -> [Node] : Unknown Player Event Type ${json.type} | Guild: ${this.guildId}`
                );
        }
    }
}
