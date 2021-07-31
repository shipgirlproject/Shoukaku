import { Client as DiscordClient, Guild, Snowflake, Collection } from 'discord.js';
import { Shoukaku } from '../../Shoukaku';
import { NodeOptions } from '../../Constants';
import { GetterObj } from '../Constants';

export class DiscordJS {
    constructor(
        client: DiscordClient
    );
    public client: DiscordClient;

    public getters(): GetterObj<Snowflake, Guild, Collection<Snowflake, Guild>>;
    public build(shoukaku: Shoukaku, nodes: NodeOptions): GetterObj<Snowflake, Guild, Collection<Snowflake, Guild>>;
}
