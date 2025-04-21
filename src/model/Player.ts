import type { LavalinkOpCodes } from './Node';
import type { Exception, Track, UpdatePlayerOptions } from './Rest';

export type TrackEndReason = 'finished' | 'loadFailed' | 'stopped' | 'replaced' | 'cleanup';
export type PlayOptions = Omit<UpdatePlayerOptions, 'filters' | 'voice'>;

export enum PlayerEventType {
	TrackStartEvent = 'TrackStartEvent',
	TrackEndEvent = 'TrackEndEvent',
	TrackExceptionEvent = 'TrackExceptionEvent',
	TrackStuckEvent = 'TrackStuckEvent',
	WebsocketClosedEvent = 'WebSocketClosedEvent'
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
	smoothing?: number;
}

export interface PlayerEvent {
	op: LavalinkOpCodes.Event;
	guildId: string;
}

export interface TrackStartEvent extends PlayerEvent {
	type: PlayerEventType.TrackStartEvent;
	track: Track;
}

export interface TrackEndEvent extends PlayerEvent {
	type: PlayerEventType.TrackEndEvent;
	track: Track;
	reason: TrackEndReason;
}

export interface TrackStuckEvent extends PlayerEvent {
	type: PlayerEventType.TrackStuckEvent;
	track: Track;
	thresholdMs: number;
}

export interface TrackExceptionEvent extends PlayerEvent {
	type: PlayerEventType.TrackExceptionEvent;
	exception: Exception;
}

export interface WebSocketClosedEvent extends PlayerEvent {
	type: PlayerEventType.WebsocketClosedEvent;
	code: number;
	byRemote: boolean;
	reason: string;
}

export interface PlayerUpdate {
	op: LavalinkOpCodes.PlayerUpdate;
	state: {
		connected: boolean;
		position: number;
		time: number;
		ping: number;
	};
	guildId: string;
}

export interface FilterOptions {
	volume?: number;
	equalizer?: Band[];
	karaoke?: KaraokeSettings | null;
	timescale?: TimescaleSettings | null;
	tremolo?: FreqSettings | null;
	vibrato?: FreqSettings | null;
	rotation?: RotationSettings | null;
	distortion?: DistortionSettings | null;
	channelMix?: ChannelMixSettings | null;
	lowPass?: LowPassSettings | null;
}
