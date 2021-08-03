import { Base64String, Snowflake } from 'discord.js';
import { EventEmitter } from 'events';
import { state } from '../Constants';
import { ShoukakuPlayer } from './ShoukakuPlayer';
import { ShoukakuSocket } from '../node/ShoukakuSocket';

export class ShoukakuConnection extends EventEmitter {
    constructor(
        player: ShoukakuPlayer,
        node: ShoukakuSocket,
        options: { guildID: Snowflake, shardID: number }
    );

    public player: ShoukakuPlayer;
    public node: ShoukakuSocket;
    public guildID: Snowflake;
    public channelID?: Snowflake;
    public shardID: number;
    public sessionID?: string;
    public region?: string;
    public muted: boolean;
    public deafened: boolean;
    public state: state.CONNECTED | state.CONNECTING | state.DISCONNECTED | state.DISCONNECTING;
    public moved: boolean;
    public reconnecting: boolean;
    private serverUpdate: boolean;

    public attemptReconnect(options: { channelID: Snowflake, forceReconnect: boolean }): Promise<void>;
    public setDeaf(deaf: boolean): void;
    public setMute(mute: boolean): void;
    public disconnect(): void;
    public connect(options: ConnectOptions): Promise<void>;
    protected setStateUpdate(options: StateUpdate): void;
    protected setServerUpdate(data: Object): void;
    protected send(d: object, important: boolean): void;
}

export interface ConnectOptions {
  guildID: Snowflake, 
  channelID: Snowflake,
  deaf: boolean, 
  mute: boolean
}

export interface StateUpdate {
  session_id: string,
  channel_id: Snowflake, 
  self_deaf: boolean, 
  self_mute: boolean
}