import { GetterObj, NodeOptions } from '../..';
import { Shoukaku } from '../../Shoukaku';

export class Eris {
    constructor(
        client: unknown
    );
    public client: unknown;
    public getters(): GetterObj;
    public build(shoukaku: Shoukaku, nodes: NodeOptions[]): GetterObj;
}
