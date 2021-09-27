import { Shoukaku } from '../../Shoukaku';
import { NodeOptions } from '../../Constants';
import { GetterObj } from '../Constants';

export class DiscordJS {
    constructor(
        client: unknown
    );
    public client: unknown;
    public getters(): GetterObj;
    public build(shoukaku: Shoukaku, nodes: NodeOptions[]): GetterObj;
}
