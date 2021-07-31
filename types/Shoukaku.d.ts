import { Snowflake } from 'discord.js';
import { ShoukakuOptions, NodeOptions } from './Constants';
import { GetterObj } from './libraries/Constants';
import { ShoukakuPlayer } from './guild/ShoukakuPlayer';
import { ShoukakuSocket } from './node/ShoukakuSocket'
import { EventEmitter } from 'events';

export class Shoukaku extends EventEmitter {
    constructor(
        library: any,
        nodes: NodeOptions,
        options: ShoukakuOptions
    );

    public library: GetterObj<any, any, any>;
    public id?: Snowflake | null;
    public nodes: Map<string, ShoukakuSocket>;
    private options: Object;

    public get players(): Map<Snowflake, ShoukakuPlayer>;

    public addNode(options: NodeOptions): void;
    public removeNode(name: string, reason: string): void;
    public getNode(query: string | Array<string>): ShoukakuSocket;
    
    protected _getIdeal(group: string): ShoukakuSocket;
    protected _clientReady(nodes: Array<Object>): void;
    protected _clientRaw(packet: Object): void;
    private _clean(name: string, players: ShoukakuPlayer[], moved: boolean): void;
}

export interface Shoukaku {
    on(event: 'debug', listener: (name: string, info: string) => void): this;
    on(event: 'error', listener: (name: string, error: Error) => void): this;
    on(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
    on(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    on(event: 'disconnect', listener: (name: string, players: ShoukakuPlayer[], moved: boolean) => void): this;
    once(event: 'debug', listener: (name: string, info: string) => void): this;
    once(event: 'error', listener: (name: string, error: Error) => void): this;
    once(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
    once(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    once(event: 'disconnect', listener: (name: string, players: ShoukakuPlayer[], moved: boolean) => void): this;
    off(event: 'debug', listener: (name: string, info: string) => void): this;
    off(event: 'error', listener: (name: string, error: Error) => void): this;
    off(event: 'ready', listener: (name: string, reconnect: boolean) => void): this;
    off(event: 'close', listener: (name: string, code: number, reason: string) => void): this;
    off(event: 'disconnect', listener: (name: string, players: ShoukakuPlayer[], moved: boolean) => void): this;
}
