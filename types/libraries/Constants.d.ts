import { Guild, Snowflake, Collection } from 'discord.js';

export interface GetterObj {
    guilds: Collection<Snowflake, Guild>,
    id: () => number,
    ws: (shardID: number, payload: string, important: boolean) => any
}
