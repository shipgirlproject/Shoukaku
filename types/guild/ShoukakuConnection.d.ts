import { EventEmitter } from 'events';
import { Guild } from 'discord.js';
import { state } from '../Constants';
import { ShoukakuPlayer } from './ShoukakuPlayer';
import { ShoukakuSocket } from '../node/ShoukakuSocket';

export class ShoukakuConnection extends EventEmitter {
    constructor(
        player: ShoukakuPlayer,
        node: ShoukakuSocket,
        guild: Guild
    );

    public player: ShoukakuPlayer;
    public node: ShoukakuSocket;
    public guildID: string;
    public channelID?: string;
    public shardID: number;
    public sessionID?: string;
    public region?: string;
    public muted: boolean;
    public deafened: boolean;
    public state: state.CONNECTED | state.CONNECTING | state.DISCONNECTED | state.DISCONNECTING;
    public moved: boolean;
    public reconnecting: boolean;
    private serverUpdate: boolean;

    public async attemptReconnect(options: { channelID: string, forceReconnect: boolean }): Promise<void>;
    public setDeaf(deaf: boolean): void;
    public setMute(mute: boolean): void;
    public disconnect(): void;
    public async connect(options: { guildID: string, channelID: string, deaf: boolean, mute: boolean }): Promise<void>;
    protected setStateUpdate(options: { session_id: string, channel_id: string, self_deaf: boolean, self_mute: boolean }): void;
    protected setServerUpdate(data: Object): void;
    protected send(d: object, important: boolean): void;
}
