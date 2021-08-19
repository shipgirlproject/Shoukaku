import { EventEmitter } from 'events';
import { state, Snowflake } from '../Constants';
import { ShoukakuPlayer } from './ShoukakuPlayer';
import { ShoukakuSocket } from '../node/ShoukakuSocket';

export class ShoukakuConnection extends EventEmitter {
  constructor(
    player: ShoukakuPlayer,
    node: ShoukakuSocket,
    options: { guildId: Snowflake, shardId: number }
  );

  public player: ShoukakuPlayer;
  public node: ShoukakuSocket;
  public guildId: Snowflake;
  public channelId?: Snowflake;
  public shardId: number;
  public sessionId?: string;
  public region?: string;
  public muted: boolean;
  public deafened: boolean;
  public state: state.CONNECTED | state.CONNECTING | state.DISCONNECTED | state.DISCONNECTING;
  public moved: boolean;
  public reconnecting: boolean;
  private serverUpdate: boolean;

  public setDeaf(deaf?: boolean): void;
  public setMute(mute?: boolean): void;
  public disconnect(): void;
  public connect(options: ConnectOptions): Promise<void>;
  public reconnect(channelId?: Snowflake): Promise<void>;
  protected setStateUpdate(options: VoiceStateUpdate): void;
  protected setServerUpdate(data: VoiceServerUpdate): void;
  protected send(d: object, important?: boolean): void;
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
