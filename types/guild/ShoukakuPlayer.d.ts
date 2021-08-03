import { EventEmitter } from 'events';
import { ShoukakuSocket } from '../node/ShoukakuSocket';
import { ShoukakuConnection } from './ShoukakuConnection';
import { ShoukakuFilter } from '../struct/ShoukakuFilter';
import { ShoukakuTrack, Base64String, Snowflake } from '../Constants';

export class ShoukakuPlayer extends EventEmitter {
  constructor(
    node: ShoukakuSocket,
    options: { guildID: Snowflake, shardID: number }
  );

  public connection: ShoukakuConnection;
  public track?: Base64String | null;
  public paused: boolean;
  public position: number;
  public filters: ShoukakuFilter;

  public moveNode(name: string): ShoukakuPlayer;
  public playTrack(input: Base64String | ShoukakuTrack, options?: { noReplace?: boolean, pause?: boolean, startTime?: number, endTime?: number }): ShoukakuPlayer;
  public stopTrack(): ShoukakuPlayer;
  public setPaused(pause: boolean): ShoukakuPlayer;
  public seekTo(position: number): ShoukakuPlayer;
  public setVolume(volume: number): ShoukakuPlayer;
  public setEqualizer(bands: { band: number, gain: number }[]): ShoukakuPlayer;
  public setKaraoke(values: { level?: number, monoLevel?: number, filterBand?: number, filterWidth?: number } | null): ShoukakuPlayer;
  public setTimescale(values: { speed?: number, pitch?: number, rate?: number } | null): ShoukakuPlayer;
  public setTremolo(values: { frequency?: number, depth?: number } | null): ShoukakuPlayer;
  public setVibrato(values: { frequency?: number, depth?: number } | null): ShoukakuPlayer;
  public setRotation(values: { rotationHz: number } | null): ShoukakuPlayer;
  public setDistortion(values: { sinOffset?: number, sinScale?: number, cosOffset?: number, cosScale?: number, tanOffset?: number, tanScale?: number, offset?: number, scale?: number } | null): ShoukakuPlayer;
  public setChannelMix(values: { leftToLeft?: number, leftToRight?: number, rightToLeft?: number, rightToRight?: number } | null): ShoukakuPlayer;
  public setLowPass(values: { smoothing: number } | null): ShoukakuPlayer;
  public setFilters(settings: ShoukakuFilter): ShoukakuPlayer;
  public cleanFilters(): ShoukakuPlayer;
  public resume(): ShoukakuPlayer;
  private updateFilters(): void;
  protected reset(): void;
  protected _onLavalinkMessage(json: Object): void;
  private _onPlayerEvent(json: Object): void;
  private _onWebsocketClosedEvent(json: WebSocketClosedEvent): void;
}

export interface ShoukakuPlayer {
  on(event: 'end', listener: (reason: TrackEndEvent) => void): this;
  on(event: 'closed', listener: (reason: WebSocketClosedEvent) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'start', listener: (data: TrackStartEvent) => void): this;
  on(event: 'exception', listener: (reason: TrackExceptionEvent) => void): this;
  on(event: 'resumed', listener: () => void): this;
  on(event: 'update', listener: (data: PlayerUpdate) => void): this;
  once(event: 'end', listener: (reason: TrackEndEvent) => void): this;
  once(event: 'closed', listener: (reason: WebSocketClosedEvent) => void): this;
  once(event: 'error', listener: (error: Error) => void): this;
  once(event: 'start', listener: (data: TrackStartEvent) => void): this;
  once(event: 'exception', listener: (reason: TrackExceptionEvent) => void): this;
  once(event: 'resumed', listener: () => void): this;
  once(event: 'update', listener: (data: PlayerUpdate) => void): this;
  off(event: 'end', listener: (reason: TrackEndEvent) => void): this;
  off(event: 'closed', listener: (reason: WebSocketClosedEvent) => void): this;
  off(event: 'error', listener: (error: Error) => void): this;
  off(event: 'start', listener: (data: TrackStartEvent) => void): this;
  off(event: 'exception', listener: (reason: TrackExceptionEvent) => void): this;
  off(event: 'resumed', listener: () => void): this;
  off(event: 'update', listener: (data: PlayerUpdate) => void): this;
}

export type TrackEndReason = "FINISHED" | "LOAD_FAILED" | "STOPPED" | "REPLACED" | "CLEANUP";

export type Severity = "COMMON" | "SUSPICIOUS" | "FAULT";

export type PlayerEventType = "TrackStartEvent" | "TrackEndEvent" | "TrackExceptionEvent" | "TrackStuckEvent" | "WebSocketClosedEvent";

export interface PlayerEvent {
  op: "event";
  type: PlayerEventType;
  guildId: Snowflake;
}

export interface Exception {
  severity: Severity;
  message: string;
  cause: string;
}

export interface TrackStartEvent extends PlayerEvent {
  type: "TrackStartEvent";
  track: Base64String;
}

export interface TrackEndEvent extends PlayerEvent {
  type: "TrackEndEvent";
  track: Base64String;
  reason: TrackEndReason;
}

export interface TrackExceptionEvent extends PlayerEvent {
  type: "TrackExceptionEvent";
  exception?: Exception;
  error: string;
}

export interface TrackStuckEvent extends PlayerEvent {
  type: "TrackStuckEvent";
  thresholdMs: number;
}

export interface WebSocketClosedEvent extends PlayerEvent {
  type: "WebSocketClosedEvent";
  code: number;
  byRemote: boolean;
  reason: string;
}

export interface PlayerUpdate {
  op: "playerUpdate";
  state: {
    position: number;
    time: number;
  };
  guildId: Snowflake;
}