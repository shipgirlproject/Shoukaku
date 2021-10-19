import { EventEmitter } from 'events';
import { ConnectOptions, Snowflake, VoiceServerUpdate, VoiceStateUpdate } from '..';
import { state } from '../Constants';
import { ShoukakuSocket } from '../node/ShoukakuSocket';
import { ShoukakuPlayer } from './ShoukakuPlayer';

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
  public state: state.CONNECTED | state.CONNECTING | state.DISCONNECTED | state.DISCONNECTING;
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
