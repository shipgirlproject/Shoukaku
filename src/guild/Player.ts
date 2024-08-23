import { Node } from '../node/Node';
import { Connection } from './Connection';
import { OpCodes, State } from '../Constants';
import { Exception, Track, UpdatePlayerInfo, UpdatePlayerOptions } from '../node/Rest';
import { NumericRange } from '../Utils';

/**
 * Why the track ended
 * https://lavalink.dev/api/websocket#track-end-reason
 */
export enum TrackEndReason {
	/**
     * Track finished playing, may start next track
     */
	FINISHED = 'finished',
	/**
     * Track failed to load, may start next track
     */
	LOAD_FAILED = 'loadFailed',
	/**
     * Track was stopped, will not start next track
     */
	STOPPED = 'stopped',
	/**
     * Track was replaced, will not start next track
     */
	REPLACED = 'replaced',
	/**
     * Track was cleaned up, will not start next track
     */
	CLEANUP = 'cleanup'
}

export type PlayOptions = Omit<UpdatePlayerOptions, 'filters' | 'voice'>;
export type ResumeOptions = Omit<UpdatePlayerOptions, 'track' | 'filters' | 'voice'>;

/**
 * Type of event dispatched
 */
export enum PlayerEventType {
	/**
     * Dispatched when a track starts playing
     */
	TRACK_START_EVENT = 'TrackStartEvent',
	/**
     * Dispatched when a track ends
     */
	TRACK_END_EVENT = 'TrackEndEvent',
	/**
     * Dispatched when a track throws an exception
     */
	TRACK_EXCEPTION_EVENT = 'TrackExceptionEvent',
	/**
     * Dispatched when a track gets stuck while playing
     */
	TRACK_STUCK_EVENT = 'TrackStuckEvent',
	/**
     * Dispatched when the websocket connection to Discord voice servers is closed
     */
	WEBSOCKET_CLOSED_EVENT = 'WebSocketClosedEvent'
}

/**
 * Equalizer configuration for each band
 * @see https://lavalink.dev/api/rest.html#equalizer
 */
export interface Band {
	/**
     * The band, there are 15 bands (0-14) that can be changed
     *
     * 0 = 25 Hz
     *
     * 1 = 40 Hz
     *
     * 2 = 63 Hz
     *
     * 3 = 100 Hz
     *
     * 4 = 160 Hz
     *
     * 5 = 250 Hz
     *
     * 6 = 400 Hz
     *
     * 7 = 630 Hz
     *
     * 8 = 1000 Hz
     *
     * 9 = 1600 Hz
     *
     * 10 = 2500 Hz
     *
     * 11 = 4000 Hz
     *
     * 12 = 6300 Hz
     *
     * 13 = 10000 Hz
     *
     * 14 = 16000 Hz
     */
	band: NumericRange<0, 14>;
	// TODO: restrict number range for decimal, current NumberRange impl only supports int
	/**
     * Multiplier for each band. Valid values range from -0.25 to 1.0, 
     * where -0.25 means the given band is completely muted, 
     * and 0.25 means it is doubled. It can also chanege volume of output.
     */
	gain: number;
}

/**
 * Uses equalization to eliminate part of a band, usually targeting vocals
 * @see https://lavalink.dev/api/rest.html#karaoke
 */
export interface KaraokeSettings {
	// TODO: restrict number range for decimal, current NumberRange impl only supports int
	/**
     * Level, minimum 0 and maximum 1.0 where 0.0 is no effect and 1.0 is full effect
     */
	level?: number;
	// TODO: restrict number range for decimal, current NumberRange impl only supports int
	/**
     * Mono level, minimum 0 and maximum 1.0 where 0.0 is no effect and 1.0 is full effect
     */
	monoLevel?: number;
	/**
     * Filter band (in Hz)
     */
	filterBand?: number;
	/**
     * Filter width
     */
	filterWidth?: number;
}

/**
 * Changes the speed, pitch, and rate
 * @see https://lavalink.dev/api/rest.html#timescale
 */
export interface TimescaleSettings {
	/**
     * Playback speed, minimum to 0.0, default to 1.0
    */
	speed?: number;
	/**
     * Pitch, minimum to 0.0, default to 1.0
     */
	pitch?: number;
	/**
     * Rate, minimum to 0.0, default to 1.0
     */
	rate?: number;
}

/**
 * Controls tremolo or vibrato
 * @see https://lavalink.dev/api/rest.html#tremolo
 * @see https://lavalink.dev/api/rest.html#vibrato
 */
export interface FreqSettings {
	/**
     * Frequency, minimum 0.0 (and maximum 14.0 for vibrato)
     */
	frequency?: number;
	/**
     * Tremolo/vibrato depth, minimum to 0.0, maximum 1.0
     */
	depth?: number;
}

/**
 * Rotates the sound around the stereo channels/user headphones (aka Audio Panning)
 * @see https://lavalink.dev/api/rest.html#rotation
 */
export interface RotationSettings {
	/**
     * Frequency of the audio rotating around the listener in Hz
     */
	rotationHz?: number;
}

/**
 * Distortion effect
 * @see https://lavalink.dev/api/rest.html#distortion
 * @see https://github.com/lavalink-devs/lavadsp/blob/master/src/main/java/com/github/natanbc/lavadsp/distortion/DistortionConverter.java#L62
 */
export interface DistortionSettings {
	/**
     * Sine offset
     */
	sinOffset?: number;
	/**
     * Sine scale (multiplier)
     */
	sinScale?: number;
	/**
     * Cosine offset
     */
	cosOffset?: number;
	/**
     * Cosine scale (multiplier)
     */
	cosScale?: number;
	/**
     * Tangent offset
     */
	tanOffset?: number;
	/**
     * Tangent scale (multiplier)
     */
	tanScale?: number;
	/**
     * Input offset
     */
	offset?: number;
	/**
     * Input scale (multiplier)
     */
	scale?: number;
}

/**
 * Mixes both channels (left and right), 
 * with a configurable factor on how much each channel affects the other, 
 * setting all factors 0.5 means both channels get the same audio
 * @see https://lavalink.dev/api/rest.html#channel-mix
 */
export interface ChannelMixSettings {
	/**
     * Left to left channel mix factor, minimum 0.0, maximum 1.0
     */
	leftToLeft?: number;
	/**
     * Left to right channel mix factor, minimum 0.0, maximum 1.0
     */
	leftToRight?: number;
	/**
     * Right to left channel mix factor, minimum 0.0, maximum 1.0
     */
	rightToLeft?: number;
	/**
     * Right to right channel mix factor, minimum 0.0, maximum 1.0
     */
	rightToRight?: number;
}

/**
 * Higher frequencies get suppressed, 
 * while lower frequencies pass through this filter, 
 * thus the name low pass, 
 * any smoothing values equal to or less than 1.0 will disable the filter
 * @see https://lavalink.dev/api/rest.html#low-pass
 */
export interface LowPassSettings {
	/**
     * Smoothing factor, minimum 1.0
     */
	smoothing?: number;
}

/**
 * State of the player
 * @see https://lavalink.dev/api/websocket.html#player-state
 */
export interface PlayerState {
	/**
     * Whether Lavalink is connected to the voice gateway
     */
	connected: boolean;
	/**
     * The position of the track in milliseconds
     */
	position: number;
	/**
     * Unix timestamp in milliseconds
     */
	time: number;
	/**
     * The ping of the node to the Discord voice server in milliseconds (-1 if not connected)
     */
	ping: number;
}

/**
 * Server dispatched an event
 * @see https://lavalink.dev/api/websocket.html#event-op
 */
export interface PlayerEvent {
	/**
     * Type of event
     */
	op: OpCodes.EVENT;
	/**
     * Discord guild ID
     */
	guildId: string;
}

/**
 * Dispatched when a track starts playing
 * @see https://lavalink.dev/api/websocket.html#trackstartevent
 */
export interface TrackStartEvent extends PlayerEvent {
	type: PlayerEventType.TRACK_START_EVENT;
	/**
     * Track that started playing
     */
	track: Track;
}

/**
 * Dispatched when a track ends
 * @see https://lavalink.dev/api/websocket.html#trackendevent
 */
export interface TrackEndEvent extends PlayerEvent {
	type: PlayerEventType.TRACK_END_EVENT;
	/**
     * Track that ended playing
     */
	track: Track;
	/**
     * Why the track ended
     */
	reason: TrackEndReason;
}

/**
 * Dispatched when a track gets stuck while playing
 * @see https://lavalink.dev/api/websocket#trackstuckevent
 */
export interface TrackStuckEvent extends PlayerEvent {
	type: PlayerEventType.TRACK_STUCK_EVENT;
	/**
     * Track that got stuck
     */
	track: Track;
	/**
     * Threshold in milliseconds that was exceeded
     */
	thresholdMs: number;
}

/**
 * Dispatched when a track throws an exception
 * @see https://lavalink.dev/api/websocket#trackexceptionevent
 */
export interface TrackExceptionEvent extends PlayerEvent {
	type: PlayerEventType.TRACK_EXCEPTION_EVENT;
	/**
     * The track that threw the exception
     */
	track: Track;
	/**
     * The occurred exception
     */
	exception: Exception;
}

/**
 * Dispatched when an audio WebSocket (to Discord) is closed, 
 * this can happen for various reasons (normal and abnormal), 
 * e.g. when using an expired voice server update, 
 * 4xxx codes are usually bad
 * @see https://lavalink.dev/api/websocket#websocketclosedevent
 * @see https://discord.com/developers/docs/topics/opcodes-and-status-codes#voice-voice-close-event-codes
 */
export interface WebSocketClosedEvent extends PlayerEvent {
	type: PlayerEventType.WEBSOCKET_CLOSED_EVENT;
	/**
     * Discord close event code
     * @see https://discord.com/developers/docs/topics/opcodes-and-status-codes#voice-voice-close-event-codes
     */
	code: number;
	/**
     * Whether the connection was closed by Discord
     */
	byRemote: boolean;
	/**
     * Why the connection was closed
     */
	reason: string;
}

/**
 * Dispatched by Lavalink at configured interval with the current state of the player
 * @see https://lavalink.dev/api/websocket#player-update-op
 */
export interface PlayerUpdate {
	op: OpCodes.PLAYER_UPDATE;
	/**
     * State of player
     */
	state: PlayerState;
	/**
     * Guild id of the player
     */
	guildId: string;
}

/**
 * Lavalink filters
 * @see https://lavalink.dev/api/rest.html#filters
 */
export interface FilterOptions {
	/**
     * Adjusts the player volume from 0.0 to 5.0, where 1.0 is 100%. Values >1.0 may cause clipping
     */
	volume?: number;
	/**
     * Adjusts 15 different bands
     * @see https://lavalink.dev/api/rest.html#equalizer
     */
	equalizer?: Band[];
	/**
     * Eliminates part of a band, usually targeting vocals
     * @see https://lavalink.dev/api/rest.html#karaoke
     */
	karaoke?: KaraokeSettings | null;
	/**
     * Changes the speed, pitch, and rate
     * @see https://lavalink.dev/api/rest.html#timescale
     */
	timescale?: TimescaleSettings | null;
	/**
     * Creates a shuddering effect, where the volume quickly oscillates
     * @see https://lavalink.dev/api/rest.html#tremolo
     */
	tremolo?: FreqSettings | null;
	/**
     * Creates a shuddering effect, where the pitch quickly oscillates
     * @see https://lavalink.dev/api/rest.html#vibrato
     */
	vibrato?: FreqSettings | null;
	/**
     * Rotates the audio around the stereo channels/user headphones (aka Audio Panning)
     * @see https://lavalink.dev/api/rest.html#rotation
     */
	rotation?: RotationSettings | null;
	/**
     * Distorts the audio
     * @see https://lavalink.dev/api/rest.html#distortion
     */
	distortion?: DistortionSettings | null;
	/**
     * Mixes both channels (left and right)
     * @see https://lavalink.dev/api/rest.html#channel-mix
     */
	channelMix?: ChannelMixSettings | null;
	/**
     * Filters higher frequencies
     * @see https://lavalink.dev/api/rest.html#low-pass
     */
	lowPass?: LowPassSettings | null;
	/**
     * Plugins can add their own filters, the key is the name of the plugin, 
     * and the value is the configuration for that plugin
     * @see https://lavalink.dev/api/rest.html#plugin-filters
     */
	pluginFilters?: Record<string, Record<string, unknown>>;
}

// Interfaces are not final, but types are, and therefore has an index signature
// https://stackoverflow.com/a/64970740
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PlayerEvents = {
	/**
     * Emitted when the current playing track ends
     * @eventProperty
     */
	'end': [reason: TrackEndEvent];
	/**
     * Emitted when the current playing track gets stuck due to an error
     * @eventProperty
     */
	'stuck': [data: TrackStuckEvent];
	/**
     * Emitted when the current websocket connection is closed
     * @eventProperty
     */
	'closed': [reason: WebSocketClosedEvent];
	/**
     * Emitted when a new track starts
     * @eventProperty
     */
	'start': [data: TrackStartEvent];
	/**
     * Emitted when there is an error caused by the current playing track
     * @eventProperty
     */
	'exception': [reason: TrackExceptionEvent];
	/**
     * Emitted when the library manages to resume the player
     * @eventProperty
     */
	'resumed': [player: Player];
	/**
     * Emitted when a playerUpdate even is received from Lavalink
     * @eventProperty
     */
	'update': [data: PlayerUpdate];
};

/**
 * Wrapper object around Lavalink
 */
export class Player extends TypedEventEmitter<PlayerEvents> {
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
	public track: string | null;
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
		const node = this.node.manager.nodes.get(name!) ?? this.node.manager.getIdealNode(connection);

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
		} catch {
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
	public playTrack(playerOptions: PlayOptions, noReplace = false): Promise<void> {
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
	public setPaused(paused = true): Promise<void> {
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
	async setFilterVolume(volume: number): Promise<void> {
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
		return this.setFilters({ karaoke: karaoke ?? null });
	}

	/**
     * Change the timescale settings applied to the currently playing track
     * @param timescale An object that conforms to the TimescaleSettings type that defines the time signature to play the audio at
     */
	public setTimescale(timescale?: TimescaleSettings): Promise<void> {
		return this.setFilters({ timescale: timescale ?? null });
	}

	/**
     * Change the tremolo settings applied to the currently playing track
     * @param tremolo An object that conforms to the FreqSettings type that defines an oscillation in volume
     */
	public setTremolo(tremolo?: FreqSettings): Promise<void> {
		return this.setFilters({ tremolo: tremolo ?? null });
	}

	/**
     * Change the vibrato settings applied to the currently playing track
     * @param vibrato An object that conforms to the FreqSettings type that defines an oscillation in pitch
     */
	public setVibrato(vibrato?: FreqSettings): Promise<void> {
		return this.setFilters({ vibrato: vibrato ?? null });
	}

	/**
     * Change the rotation settings applied to the currently playing track
     * @param rotation An object that conforms to the RotationSettings type that defines the frequency of audio rotating round the listener
     */
	public setRotation(rotation?: RotationSettings): Promise<void> {
		return this.setFilters({ rotation: rotation ?? null });
	}

	/**
     * Change the distortion settings applied to the currently playing track
     * @param distortion An object that conforms to DistortionSettings that defines distortions in the audio
     * @returns The current player instance
     */
	public setDistortion(distortion?: DistortionSettings): Promise<void> {
		return this.setFilters({ distortion: distortion ?? null });
	}

	/**
     * Change the channel mix settings applied to the currently playing track
     * @param channelMix An object that conforms to ChannelMixSettings that defines how much the left and right channels affect each other (setting all factors to 0.5 causes both channels to get the same audio)
     */
	public setChannelMix(channelMix?: ChannelMixSettings): Promise<void> {
		return this.setFilters({ channelMix: channelMix ?? null });
	}

	/**
     * Change the low pass settings applied to the currently playing track
     * @param lowPass An object that conforms to LowPassSettings that defines the amount of suppression on higher frequencies
     */
	public setLowPass(lowPass?: LowPassSettings): Promise<void> {
		return this.setFilters({ lowPass: lowPass ?? null });
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
			lowPass: null
		});
	}

	/**
     * Resumes the current track
     * @param options An object that conforms to ResumeOptions that specify behavior on resuming
     * @param noReplace Set it to true if you don't want to replace the currently playing track
     */
	public async resume(options: ResumeOptions = {}, noReplace = false): Promise<void> {
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
	public async update(playerOptions: UpdatePlayerOptions, noReplace = false): Promise<void> {
		const data = {
			guildId: this.guildId,
			noReplace,
			playerOptions
		};

		await this.node.rest.updatePlayer(data);

		if (!noReplace) this.paused = false;

		if (playerOptions.filters) {
			const filters = { ...this.filters, ...playerOptions.filters };
			this.filters = filters;
		}

		if (typeof playerOptions.track !== 'undefined')
			this.track = playerOptions.track.encoded ?? null;
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
	public onPlayerUpdate(json: PlayerUpdate): void {
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
	public onPlayerEvent(json: TrackStartEvent | TrackEndEvent | TrackStuckEvent | TrackExceptionEvent | WebSocketClosedEvent): void {
		switch (json.type) {
			case PlayerEventType.TRACK_START_EVENT:
				if (this.track) this.track = json.track.encoded;
				this.emit('start', json);
				break;
			case PlayerEventType.TRACK_END_EVENT:
				this.emit('end', json);
				break;
			case PlayerEventType.TRACK_STUCK_EVENT:
				this.emit('stuck', json);
				break;
			case PlayerEventType.TRACK_EXCEPTION_EVENT:
				this.emit('exception', json);
				break;
			case PlayerEventType.WEBSOCKET_CLOSED_EVENT:
				this.emit('closed', json);
				break;
			default:
				this.node.manager.emit(
					'debug',
					this.node.name,
					`[Player] -> [Node] : Unknown Player Event Type, Data => ${JSON.stringify(json)}`
				);
		}
	}
}
