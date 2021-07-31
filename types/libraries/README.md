# Make your own Library Implementation Typings

Should follow this structire. Replace `<ClientClass>` with your client of choice's client class, replace `<DiscordLib>` with your client of choice's name, replace `<MapLike>` with your client of choice's way of storing guilds' interface (this must be a `Map`, or a interface that extends a `Map`), replace `<MapKey>` and `<MapValue>` with the key type and value type of your client of choice's guild `<MapLike>`. Your typings file should also be named `<DiscordLib>.d.ts` and be placed inside the wrappers folder. You should also edit the `Libraries.d.ts` and add your Library Implementation Typings class to the `Libraries` interface.
```ts
import { <ClientClass> as DiscordClient } from '<DiscordLib>';
import { Shoukaku } from '../Shoukaku';
import { NodeOptions } from '../Constants';
import { GetterObj } from './Constants';

export class <DiscordLib> {
    constructor(
        client: <ClientClass>
    );
    public getters(): GetterObj<<MapKey>, <MapValue>, <MapLike<<Mapkey>, <MapValue>>>>;
    public build(shoukaku: Shoukaku, nodes: NodeOptions): GetterObj;
}
```
