import { EventEmitter } from 'events';
import { GetterObj, NodeOptions, ShoukakuOptions, Snowflake } from '.';
import { ShoukakuPlayer } from './guild/ShoukakuPlayer';
import { ShoukakuSocket } from './node/ShoukakuSocket';

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
    public once(event: 'debug', listener: (name: string, info: string) => void): this;
    public once(event: 'error', listener: (name: string, error: Error) => void): this;
    public once(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
    public once(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    public once(event: 'disconnect', listener: (name: string, players: ShoukakuPlayer[], moved: boolean) => void): this;
    public once(event: 'playerReady', listener: (name: string, player: ShoukakuPlayer) => void): this;
    public once(event: 'playerDestroy', listener: (name: string, player: ShoukakuPlayer) => void): this;
    public off(event: 'debug', listener: (name: string, info: string) => void): this;
    public off(event: 'error', listener: (name: string, error: Error) => void): this;
    public off(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
    public off(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    public off(event: 'disconnect', listener: (name: string, players: ShoukakuPlayer[], moved: boolean) => void): this;
    public off(event: 'playerReady', listener: (name: string, player: ShoukakuPlayer) => void): this;
    public off(event: 'playerDestroy', listener: (name: string, player: ShoukakuPlayer) => void): this;
}
