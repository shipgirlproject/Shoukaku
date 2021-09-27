import { Snowflake } from '../Constants';

export interface GetterObj {
    guilds: Map<any, any>;
    id: () => Snowflake;
    ws: (shardId: number, payload: string, important: boolean) => any;
}
