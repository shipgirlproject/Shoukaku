import { Client as DiscordClient } from 'discord.js';
import { Shoukaku } from '../Shoukaku';
import { NodeOptions } from '../Constants';
import { GetterObj } from './Constants';

export class DiscordJS {
    constructor(
        client: DiscordClient
    );
    public client: DiscordClient;

    public getters(): GetterObj;
    public build(shoukaku: Shoukaku, nodes: NodeOptions): GetterObj;
}
