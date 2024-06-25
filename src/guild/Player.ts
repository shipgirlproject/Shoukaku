import { EventEmitter } from 'events';
import { Node } from '../node/Node';
import { Connection } from './Connection';
import { OpCodes, State, ShoukakuDefaults } from '../Constants';
import { Exception, Track, UpdatePlayerInfo, UpdatePlayerOptions } from '../node/Rest';
import { time } from 'console';

export type TrackEndReason = 'finished' | 'loadFailed' | 'stopped' | 'replaced' | 'cleanup';
export type PlayerEventType = 'TrackStartEvent' | 'TrackEndEvent' | 'TrackExceptionEvent' | 'TrackStuckEvent' | 'WebSocketClosedEvent';
export type PlayOptions = Omit<UpdatePlayerOptions, 'filters' | 'voice'>;
export type ResumeOptions = Omit<UpdatePlayerOptions, 'track' | 'filters' | 'voice'>;

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
     * Base64 encoded data of the current track
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

    public get data(): UpdatePlayerInfo {
        const connection = this.node.manager.connections.get(this.guildId)!;
        return {
            guildId: this.guildId,
            playerOptions: {
                track: { 
                    encoded: this.track 
                },
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
     * @param name Name of node to move to, or the default ideal node
     * @returns true if the player was moved, false if not
     */
    public async move(name?: string): Promise<boolean> {
        const connection = this.node.manager.connections.get(this.guildId);
        const node = this.node.manager.nodes.get(name!) || this.node.manager.getIdealNode(connection);

        if (!node && ![ ...this.node.manager.nodes.values() ].some(node => node.state === State.CONNECTED))
            throw new Error('No available nodes to move to');

        if (!node || node.name === this.node.name || node.state !== State.CONNECTED) return false;

        let lastNode = this.node.manager.nodes.get(this.node.name);
        if (!lastNode || lastNode.state !== State.CONNECTED)
            lastNode = this.node.manager.getIdealNode(connection);

        await this.destroy();
        
        try {   
            this.node = node;
            await this.resume();
            return true;
        } catch (error) {
            this.node = lastNode!;
            await this.resume();
            return false;
        }
    }

    /**
     * Destroys the player in remote lavalink side
     */
    public async destroy(): Promise<void> {
        await this.node.rest.destroyPlayer(this.guildId);
    }

    /**
     * Play a new track
     * @param playable Options for playing this track
     * @param noReplace Set it to true if you don't want to replace the currently playing track
     */
    public playTrack(playerOptions: PlayOptions, noReplace: boolean = false): Promise<void> {
        return this.update(playerOptions, noReplace);
    }

    /**
     * Stop the currently playing track
     */
    public stopTrack(): Promise<void> {
        return this.update({ track: { encoded: null }, position: 0 });
    }

    /**
     * Pause or unpause the currently playing track
     * @param paused Boolean value to specify whether to pause or unpause the current bot user
     */
    public setPaused(paused: boolean = true): Promise<void> {
        return this.update({ paused });
    }

    /**
     * Seek to a specific time in the currently playing track
     * @param position Position to seek to in milliseconds
     */
    public seekTo(position: number): Promise<void> {
        return this.update({ position });
    }

    /**
     * Sets the global volume of the player
     * @param volume Target volume 0-1000
     */
    public setGlobalVolume(volume: number): Promise<void> {
        return this.update({ volume });
    }

    /**
     * Sets the filter volume of the player
     * @param volume Target volume 0.0-5.0
     */
    async setFilterVolume(volume: number):  Promise<void> {
        return this.setFilters({ volume });
    }

    /**
     * Change the equalizer settings applied to the currently playing track
     * @param equalizer An array of objects that conforms to the Bands type that define volumes at different frequencies
     */
    public async setEqualizer(equalizer: Band[]): Promise<void> {
        return this.setFilters({ equalizer });
    }

    /**
     * Change the karaoke settings applied to the currently playing track
     * @param karaoke An object that conforms to the KaraokeSettings type that defines a range of frequencies to mute
     */
    public setKaraoke(karaoke?: KaraokeSettings): Promise<void> {
        return this.setFilters({ karaoke: karaoke || null });
    }

    /**
     * Change the timescale settings applied to the currently playing track
     * @param timescale An object that conforms to the TimescaleSettings type that defines the time signature to play the audio at
     */
    public setTimescale(timescale?: TimescaleSettings): Promise<void> {
        return this.setFilters({ timescale: timescale || null });
    }

    /**
     * Change the tremolo settings applied to the currently playing track
     * @param tremolo An object that conforms to the FreqSettings type that defines an oscillation in volume
     */
    public setTremolo(tremolo?: FreqSettings): Promise<void> {
        return this.setFilters({ tremolo: tremolo || null });
    }

    /**
     * Change the vibrato settings applied to the currently playing track
     * @param vibrato An object that conforms to the FreqSettings type that defines an oscillation in pitch
     */
    public setVibrato(vibrato?: FreqSettings): Promise<void> {
        return this.setFilters({ vibrato: vibrato || null });
    }

    /**
     * Change the rotation settings applied to the currently playing track
     * @param rotation An object that conforms to the RotationSettings type that defines the frequency of audio rotating round the listener
     */
    public setRotation(rotation?: RotationSettings): Promise<void> {
        return this.setFilters({ rotation: rotation || null });
    }

    /**
     * Change the distortion settings applied to the currently playing track
     * @param distortion An object that conforms to DistortionSettings that defines distortions in the audio
     * @returns The current player instance
     */
    public setDistortion(distortion?: DistortionSettings): Promise<void> {
        return this.setFilters({ distortion: distortion || null });
    }

    /**
     * Change the channel mix settings applied to the currently playing track
     * @param channelMix An object that conforms to ChannelMixSettings that defines how much the left and right channels affect each other (setting all factors to 0.5 causes both channels to get the same audio)
     */
    public setChannelMix(channelMix?: ChannelMixSettings): Promise<void> {
        return this.setFilters({ channelMix: channelMix || null });
    }

    /**
     * Change the low pass settings applied to the currently playing track
     * @param lowPass An object that conforms to LowPassSettings that defines the amount of suppression on higher frequencies
     */
    public setLowPass(lowPass?: LowPassSettings): Promise<void> {
        return this.setFilters({ lowPass: lowPass || null });
    }

    /**
     * Change the all filter settings applied to the currently playing track
     * @param filters An object that conforms to FilterOptions that defines all filters to apply/modify
     */
    public setFilters(filters: FilterOptions): Promise<void> {
        return this.update({ filters });
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
     * @param noReplace Set it to true if you don't want to replace the currently playing track
     */
    public async resume(options: ResumeOptions = {}, noReplace: boolean = false): Promise<void> {
        const data = this.data;

        if (typeof options.position === 'number') 
            data.playerOptions.position = options.position;
        if (typeof options.endTime === 'number')
            data.playerOptions.endTime = options.endTime;
        if (typeof options.paused === 'boolean')
            data.playerOptions.paused = options.paused;
        if (typeof options.volume === 'number')
            data.playerOptions.volume = options.volume;

        await this.update(data.playerOptions, noReplace);

        this.emit('resumed', this);
    }

    /**
     * If you want to update the whole player yourself, sends raw update player info to lavalink
     * @param playerOptions Options to update the player data
     * @param noReplace Set it to true if you don't want to replace the currently playing track
     */
    public async update(playerOptions: UpdatePlayerOptions, noReplace: boolean = false): Promise<void> {
        const data = {
            guildId: this.guildId,
            noReplace,
            playerOptions
        }

        await this.node.rest.updatePlayer(data);

        if (playerOptions.filters) {
            const filters = { ...this.filters, ...playerOptions.filters };
            this.filters = filters;
        }

        if (typeof playerOptions.track !== 'undefined')
            this.track = playerOptions.track.encoded || null;
        if (typeof playerOptions.paused === 'boolean')
            this.paused = playerOptions.paused;
        if (typeof playerOptions.volume === 'number')
            this.volume = playerOptions.volume;
        if (typeof playerOptions.position === 'number')
            this.position = playerOptions.position;
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
