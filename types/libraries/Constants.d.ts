import { Snowflake } from '../Constants';

export interface GetterObj {
  guilds: Map<unknown, unknown>;
  id: () => Snowflake;
  ws: (shardId: number, payload: string, important: boolean) => void;
}
