import { EventEmitter } from 'events';
import { JoinOptions, Snowflake } from '..';
import { state } from '../Constants';
import { ShoukakuPlayer } from '../guild/ShoukakuPlayer';
import { Shoukaku } from '../Shoukaku';
import { ShoukakuStats } from '../struct/ShoukakuStats';
import { ShoukakuQueue } from './ShoukakuQueue';
import { ShoukakuRest } from './ShoukakuRest';

export class ShoukakuSocket extends EventEmitter {
    constructor(shoukaku: Shoukaku, options: { name: string, url: string, auth: string, secure: boolean, group?: string });

    public shoukaku: Shoukaku;
    public players: Map<Snowflake, ShoukakuPlayer>;
    public rest: ShoukakuRest;
    public queue: ShoukakuQueue;
    public state: state.CONNECTED | state.CONNECTING | state.DISCONNECTED | state.DISCONNECTING;
    public stats: ShoukakuStats;
    public reconnects: number;
    public name: string;
    public group: string;
    public url: string;
    public destroyed: boolean;
    public joinChannel(options: JoinOptions): Promise<ShoukakuPlayer>;
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
