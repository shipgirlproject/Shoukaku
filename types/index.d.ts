import * as Constants from "./enums";
import { EventEmitter } from "events";

export type TrackEndReason = "FINISHED" | "LOAD_FAILED" | "STOPPED" | "REPLACED" | "CLEANUP";
export type Severity = "COMMON" | "SUSPICIOUS" | "FAULT";
export type PlayerEventType = "TrackStartEvent" | "TrackEndEvent" | "TrackExceptionEvent" | "TrackStuckEvent" | "WebSocketClosedEvent";
export type ShoukakuTrackListType = "PLAYLIST" | "TRACK" | "SEARCH" | "NO_MATCHES" | "LOAD_FAILED";
export type LavalinkSource = "youtube" | "youtubemusic" | "soundcloud";
export type Snowflake = `${bigint}` | string;
export type Base64String = string;

export class Shoukaku extends EventEmitter {
  constructor(library: unknown, nodes: NodeOptions[], options: ShoukakuOptions);

  public library: GetterObj;
  public id?: Snowflake | null;
  public nodes: Map<Snowflake, ShoukakuSocket>;
  public get players(): Map<Snowflake, ShoukakuPlayer>;
  public addNode(options: NodeOptions): void;
  public removeNode(name: string, reason?: string): void;
  public getNode(query?: string | string[]): ShoukakuSocket;
  protected _getIdeal(group: string): ShoukakuSocket;
  protected _clientReady(nodes: NodeOptions[]): void;
  protected _clientRaw(packet: Object): void;
  private options: Object;
  private _clean(name: string, players: ShoukakuPlayer[], moved: boolean): void;

  public on(event: 'debug', listener: (name: string, info: string) => void): this;
  public on(event: 'error', listener: (name: string, error: Error) => void): this;
  public on(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
  public on(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
  public on(event: 'disconnect', listener: (name: string, players: ShoukakuPlayer[], moved: boolean) => void): this;
  public on(event: 'playerReady', listener: (name: string, player: ShoukakuPlayer) => void): this;
  public on(event: 'playerDestroy', listener: (name: string, player: ShoukakuPlayer) => void): this;
  public on(event: 'playerTrackStart', listener: (name: string, player: ShoukakuPlayer) => void): this;
  public on(event: 'playerTrackEnd', listener: (name: string, player: ShoukakuPlayer) => void): this;
  public on(event: 'playerException', listener: (name: string, player: ShoukakuPlayer, reason: TrackExceptionEvent) => void): this;
  public on(event: 'playerClosed', listener: (name: string, player: ShoukakuPlayer, reason: WebSocketClosedEvent) => void): this;
  public once(event: 'debug', listener: (name: string, info: string) => void): this;
  public once(event: 'error', listener: (name: string, error: Error) => void): this;
  public once(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
  public once(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
  public once(event: 'disconnect', listener: (name: string, players: ShoukakuPlayer[], moved: boolean) => void): this;
  public once(event: 'playerReady', listener: (name: string, player: ShoukakuPlayer) => void): this;
  public once(event: 'playerDestroy', listener: (name: string, player: ShoukakuPlayer) => void): this;
  public once(event: 'playerTrackEnd', listener: (name: string, player: ShoukakuPlayer) => void): this;
  public off(event: 'debug', listener: (name: string, info: string) => void): this;
  public off(event: 'error', listener: (name: string, error: Error) => void): this;
  public off(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
  public off(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
  public off(event: 'disconnect', listener: (name: string, players: ShoukakuPlayer[], moved: boolean) => void): this;
  public off(event: 'playerReady', listener: (name: string, player: ShoukakuPlayer) => void): this;
  public off(event: 'playerDestroy', listener: (name: string, player: ShoukakuPlayer) => void): this;
  public off(event: 'playerTrackEnd', listener: (name: string, player: ShoukakuPlayer) => void): this;
}

export class Utils {
  public static getVersion(): { variant: "light" | "vanilla", version: string } | never;
  public static mergeDefault(def: Object, given: Object): Object;
  public static searchType(string: string): Constants.SearchTypes.soundcloud | Constants.SearchTypes.youtube | Constants.SearchTypes.youtubemusic;
  public static wait(ms: number): Promise<void>;
}

export class ShoukakuQueue {
  constructor(socket: ShoukakuSocket);

  public socket: ShoukakuSocket;
  public pending: string[];
  public enqueue(data: Object, important?: boolean): void;
  public process(): void;
  public clear(): void;
}

export class ShoukakuRest {
  constructor(node: { url: string, auth: string, secure: boolean }, options: { userAgent: string, timeout: number });

  public url: string;
  public timeout: number;
  public resolve(identifier: string, search?: LavalinkSource): Promise<ShoukakuTrackList>;
  public decode(track: string): Promise<DecodedTrack>;
  public getRoutePlannerStatus(): Promise<Object>;
  public unmarkFailedAddress(address: string): Promise<void>;
  public unmarkAllFailedAddress(): Promise<void>;
  protected fetch(url: string, options?: { method: string, options?: Object }): Promise<Object>;
  private auth: string;
  private userAgent: string;
  private get router(): number;
}

export function ShoukakuRouter(rest: ShoukakuRest): typeof Proxy | Object | string | void;

export class ShoukakuSocket extends EventEmitter {
  constructor(shoukaku: Shoukaku, options: { name: string; url: string; auth: string; secure: boolean; group?: string });

  public shoukaku: Shoukaku;
  public players: Map<Snowflake, ShoukakuPlayer>;
  public rest: ShoukakuRest;
  public queue: ShoukakuQueue;
  public state: Constants.state.CONNECTED | Constants.state.CONNECTING | Constants.state.DISCONNECTED | Constants.state.DISCONNECTING;
  public stats: ShoukakuStats;
  public reconnects: number;
  public name: string;
  public group: string;
  public url: string;
  public destroyed: boolean;
  public joinChannel(options: JoinOptions, metadata?: PlayerMetadata): Promise<ShoukakuPlayer>;
  public leaveChannel(guildId: Snowflake): void;
  public send(data: Object, important: boolean): void;
  protected connect(reconnect?: boolean): void;
  protected disconnect(code?: number, reason?: string): void;
  protected _clientRaw(packet: Object): void;
  private get userAgent(): string;
  private get resumable(): boolean;
  private get resumableTimeout(): number;
  private get moveOnDisconnect(): boolean;
  private get reconnectTries(): number;
  private get reconnectInterval(): number;
  private get penalties(): number;
  private auth: string;
  private _open(response: Object, reconnect?: boolean): void;
  private _message(message: string): void;
  private _close(code: number, reason: string): void;
  private _clean(): void;
  private _reconnect(): void;
  private _disconnect(code: number, reason: string): void;
}

export class ShoukakuConnection extends EventEmitter {
  constructor(player: ShoukakuPlayer, node: ShoukakuSocket, options: { guildId: Snowflake, shardId: number });

  public player: ShoukakuPlayer;
  public node: ShoukakuSocket;
  public guildId: Snowflake;
  public channelId?: Snowflake;
  public shardId: number;
  public sessionId?: string;
  public region?: string;
  public muted: boolean;
  public deafened: boolean;
  public state: Constants.state.CONNECTED | Constants.state.CONNECTING | Constants.state.DISCONNECTED | Constants.state.DISCONNECTING;
  public moved: boolean;
  public reconnecting: boolean;
  public setDeaf(deaf?: boolean): void;
  public setMute(mute?: boolean): void;
  public disconnect(): void;
  public connect(options: ConnectOptions): Promise<void>;
  public reconnect(channelId?: Snowflake): Promise<void>;
  protected setStateUpdate(options: VoiceStateUpdate): void;
  protected setServerUpdate(data: VoiceServerUpdate): void;
  protected send(d: object, important?: boolean): void;
  private serverUpdate: boolean;
}

export class ShoukakuPlayer extends EventEmitter {
  constructor(node: ShoukakuSocket, options: { guildId: Snowflake, shardId: number });

  public connection: ShoukakuConnection;
  public track?: Base64String | null;
  public paused: boolean;
  public position: number;
  public filters: ShoukakuFilter;
  public metadata?: PlayerMetadata;
  public moveNode(name: string): ShoukakuPlayer;
  public playTrack(input: Base64String | ShoukakuTrack, options?: { noReplace?: boolean, pause?: boolean, startTime?: number, endTime?: number }): ShoukakuPlayer;
  public stopTrack(): ShoukakuPlayer;
  public setPaused(pause?: boolean): ShoukakuPlayer;
  public seekTo(position: number): ShoukakuPlayer;
  public setVolume(volume: number): ShoukakuPlayer;
  public setEqualizer(bands: { band: number, gain: number }[]): ShoukakuPlayer;
  public setKaraoke(values: { level?: number, monoLevel?: number, filterBand?: number, filterWidth?: number } | null): ShoukakuPlayer;
  public setTimescale(values: { speed?: number, pitch?: number, rate?: number } | null): ShoukakuPlayer;
  public setTremolo(values: { frequency?: number, depth?: number } | null): ShoukakuPlayer;
  public setVibrato(values: { frequency?: number, depth?: number } | null): ShoukakuPlayer;
  public setRotation(values: { rotationHz?: number } | null): ShoukakuPlayer;
  public setDistortion(values: { sinOffset?: number, sinScale?: number, cosOffset?: number, cosScale?: number, tanOffset?: number, tanScale?: number, offset?: number, scale?: number } | null): ShoukakuPlayer;
  public setChannelMix(values: { leftToLeft?: number, leftToRight?: number, rightToLeft?: number, rightToRight?: number } | null): ShoukakuPlayer;
  public setLowPass(values: { smoothing?: number } | null): ShoukakuPlayer;
  public setFilters(settings: ShoukakuFilter): ShoukakuPlayer;
  public clearFilters(): ShoukakuPlayer;
  public resume(options?: { noReplace?: boolean, pause?: boolean, startTime?: number, endTime?: number }): ShoukakuPlayer;
  private updateFilters(): void;
  protected clean(): void;
  protected reset(): void;
  protected _onLavalinkMessage(json: Object): void;
  private _onPlayerEvent(json: Object): void;
  private _onWebsocketClosedEvent(json: WebSocketClosedEvent): void;

  public on(event: 'end', listener: (reason: TrackEndEvent) => void): this;
  public on(event: 'closed', listener: (reason: WebSocketClosedEvent) => void): this;
  public on(event: 'error', listener: (error: Error) => void): this;
  public on(event: 'start', listener: (data: TrackStartEvent) => void): this;
  public on(event: 'exception', listener: (reason: TrackExceptionEvent) => void): this;
  public on(event: 'resumed', listener: () => void): this;
  public on(event: 'update', listener: (data: PlayerUpdate) => void): this;
  public once(event: 'end', listener: (reason: TrackEndEvent) => void): this;
  public once(event: 'closed', listener: (reason: WebSocketClosedEvent) => void): this;
  public once(event: 'error', listener: (error: Error) => void): this;
  public once(event: 'start', listener: (data: TrackStartEvent) => void): this;
  public once(event: 'exception', listener: (reason: TrackExceptionEvent) => void): this;
  public once(event: 'resumed', listener: () => void): this;
  public once(event: 'update', listener: (data: PlayerUpdate) => void): this;
  public off(event: 'end', listener: (reason: TrackEndEvent) => void): this;
  public off(event: 'closed', listener: (reason: WebSocketClosedEvent) => void): this;
  public off(event: 'error', listener: (error: Error) => void): this;
  public off(event: 'start', listener: (data: TrackStartEvent) => void): this;
  public off(event: 'exception', listener: (reason: TrackExceptionEvent) => void): this;
  public off(event: 'resumed', listener: () => void): this;
  public off(event: 'update', listener: (data: PlayerUpdate) => void): this;
}

export class ShoukakuFilter {
  constructor(settings: FilterSettings);

  public volume: number;
  public equalizer: FilterEqSettings[];
  public karaoke: FilterKaraokeSettings | null;
  public timescale: FilterTimescaleSettings | null;
  public tremolo: FilterFreqSettings | null;
  public vibrato: FilterFreqSettings | null;
  public rotation: FilterRotationSettings | null;
  public distortion: FilterDistortionSettings | null;
  public channelMix: FilterChannelMixSettings | null;
  public lowPass: FilterLowPassSettings | null;
}

export class ShoukakuStats {
  constructor(status: OPStats);

  public players: number;
  public playingPlayers: number;
  public memory: OPMemStats;
  public frameStats: OPFrameStats;
  public cpu: OPCPUStats;
  public uptime: number;
}

export class ShoukakuTrack {
  constructor(raw: object);
  public track: Base64String;
  public info: {
    identifier?: string;
    isSeekable?: boolean;
    author?: string;
    length?: number;
    isStream?: boolean;
    position?: number;
    title?: string;
    uri?: string;
  };
}

export class ShoukakuTrackList {
  constructor(raw: object);
  public type: ShoukakuTrackListType;
  public selectedTrack: number;
  public playlistName?: string;
  public tracks: ShoukakuTrack[];
}

export interface ConnectOptions {
  guildId: Snowflake;
  shardId: number;
  channelId: Snowflake;
  deaf?: boolean;
  mute?: boolean;
}

export interface VoiceServerUpdate {
  token: string;
  guild_id: Snowflake;
  endpoint: string | null;
}

export interface VoiceStateUpdate {
  session_id: string;
  channel_id: Snowflake;
  self_deaf: boolean;
  self_mute: boolean;
}

export interface GetterObj {
  guilds: Map<unknown, unknown>;
  id: () => Snowflake;
  ws: (shardId: number, payload: string, important: boolean) => void;
}

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

export interface DecodedTrack {
  identifier?: string;
  isSeekable?: boolean;
  author?: string;
  length?: number;
  isStream?: boolean;
  position?: number;
  title?: string;
  uri?: string;
  sourceName?: string;
}

export interface JoinOptions {
  guildId: Snowflake;
  shardId: number;
  channelId: Snowflake;
  mute?: boolean;
  deaf?: boolean;
}

export interface FilterSettings {
  volume: number;
  equalizer?: FilterEqSettings[];
  karaoke?: FilterKaraokeSettings;
  timescale?: FilterTimescaleSettings;
  tremolo?: FilterFreqSettings;
  vibrato?: FilterFreqSettings;
  rotation?: FilterRotationSettings;
  distortion?: FilterDistortionSettings;
  channelMix?: FilterChannelMixSettings;
  lowPass?: FilterLowPassSettings
}

export interface FilterChannelMixSettings {
  leftToLeft?: number;
  leftToRight?: number;
  rightToLeft?: number;
  rightToRight?: number;
}

export interface FilterLowPassSettings {
  smoothing?: number
}

export interface FilterEqSettings {
  band: number;
  gain: number;
}

export interface FilterKaraokeSettings {
  level?: number;
  monoLevel?: number;
  filterBand?: number;
  filterWidth?: number;
}

export interface FilterTimescaleSettings {
  speed?: number;
  pitch?: number;
  rate?: number;
}

export interface FilterFreqSettings {
  frequency?: number;
  depth?: number;
}

export interface FilterRotationSettings {
  rotationHz?: number;
}

export interface FilterDistortionSettings {
  sinOffset?: number;
  sinScale?: number;
  cosOffset?: number;
  cosScale?: number;
  tanOffset?: number;
  tanScale?: number;
  offset?: number;
  scale?: number;
}

export interface OPStats {
  players: number;
  playingPlayers: number;
  memory: OPMemStats;
  frameStats: OPFrameStats;
  cpu: OPCPUStats;
  uptime: number;
}

export interface OPMemStats {
  reservable: number;
  used: number;
  free: number;
  allocated: number;
}

export interface OPFrameStats {
  sent: number;
  deficit: number;
  nulled: number;
}

export interface OPCPUStats {
  cores: number;
  systemLoad: number;
  lavalinkLoad: number;
}

export interface ShoukakuOptions {
  resumable?: boolean;
  resumableTimeout?: number;
  reconnectTries?: number;
  moveOnDisconnect?: boolean;
  restTimeout?: number;
  reconnectInterval?: number;
  userAgent?: string;
}

export interface NodeOptions {
  name: string;
  url: string;
  auth: string;
  secure?: boolean;
  group?: string;
}

export interface PlayerMetadata {}