import type {
	Band,
	ChannelMixSettings,
	DistortionSettings,
	FilterOptions,
	FreqSettings,
	KaraokeSettings,
	LowPassSettings,
	PlayOptions,
	RotationSettings,
	TimescaleSettings
} from '../model/Player';
import { LavalinkPlayer, UpdatePlayerOptions } from '../model/Rest';
import type { Node } from '../node/Node';

import { Connection } from './Connection';

/**
 * Wrapper object around Lavalink
 */
export class Player {
	/**
	 * GuildId of this player
	 */
	public readonly guildId: string;
	/**
	 * Lavalink node this player is connected to
	 */
	public node: Node;

	constructor(guildId: string, node: Node) {
		this.guildId = guildId;
		this.node = node;
	}

	/**
	 * Destroys the player in remote Lavalink side
	 */
	public async destroy(): Promise<void> {
		await this.node.rest.destroyPlayer(this.guildId);
	}

	/**
	 * Play a new track
	 */
	public async playTrack(playerOptions: PlayOptions, noReplace = false): Promise<void> {
		await this.update(playerOptions, noReplace);
	}

	/**
	 * Stop the currently playing track
	 */
	public async stopTrack(): Promise<void> {
		await this.update({ track: { encoded: null }, position: 0 });
	}

	/**
	 * Pause or unpause the currently playing track
	 * @param paused Boolean value to specify whether to pause or unpause the current bot user
	 */
	public async setPaused(paused = true): Promise<void> {
		await this.update({ paused });
	}

	/**
	 * Seek to a specific time in the currently playing track
	 * @param position Position to seek to in milliseconds
	 */
	public async seekTo(position: number): Promise<void> {
		await this.update({ position });
	}

	/**
	 * Sets the global volume of the player
	 * @param volume Target volume 0-1000
	 */
	public async setGlobalVolume(volume: number): Promise<void> {
		await this.update({ volume });
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
	public async setFilters(filters: FilterOptions): Promise<void> {
		await this.update({ filters });
	}

	/**
	 * Clear all filters applied to the currently playing track
	 */
	public async clearFilters(): Promise<void> {
		await this.update({ filters: undefined });
	}

	/**
	 * If you want to update the whole player yourself, sends raw update player info to lavalink
	 * @param playerOptions Options to update the player data
	 * @param noReplace Set it to true if you don't want to replace the currently playing track
	 */
	public async update(playerOptions: UpdatePlayerOptions, noReplace = false): Promise<LavalinkPlayer> {
		return this.node.rest.updatePlayer(this.guildId, playerOptions, noReplace);
	}

	/**
	 * Sends server update to lavalink
	 * @internal
	 */
	public async sendServerUpdate(connection: Connection): Promise<void> {
		await this.node.rest.updatePlayer(this.guildId, {
			voice: {
				token: connection.serverUpdate!.token,
				endpoint: connection.serverUpdate!.endpoint,
				sessionId: connection.sessionId!
			}
		}, false);
	}
}
