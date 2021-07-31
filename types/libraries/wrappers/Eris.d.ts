import { Client as DiscordClient } from 'eris';
import { Shoukaku } from '../../Shoukaku';
import { NodeOptions } from '../../Constants';
import { GetterObj } from '../Constants';

export class Eris {
    constructor(
        client: DiscordClient
    );
    public client: DiscordClient;

    public getters(): GetterObj<string, object, Map<string, object>>;
    public build(shoukaku: Shoukaku, nodes: NodeOptions): GetterObj<string, object, Map<string, object>>;
}
