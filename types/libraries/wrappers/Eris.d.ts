import { Client as DiscordClient } from 'eris';
import { Shoukaku } from '../../Shoukaku';
import { NodeOptions, Snowflake } from '../../Constants';
import { GetterObj } from '../Constants';

export class Eris {
    constructor(
        client: DiscordClient
    );
    public client: DiscordClient;

    public getters(): GetterObj<Snowflake, object, Map<Snowflake, object>>;
    public build(shoukaku: Shoukaku, nodes: NodeOptions[]): GetterObj<Snowflake, object, Map<Snowflake, object>>;
}
