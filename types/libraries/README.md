# Make your own Library Implementation Typings

Should follow this structire, just replace `<ClientClass>` with your client of choice's client class and replace `<DiscordLib>` with your client of choice's name. Your typings file should also be named `<DiscordLib>.d.ts`. You should also edit the `Libraries.d.ts` and add your Library Implementation Typings class to the `Libraries` interface.
```ts
import { <ClientClass> as DiscordClient } from '<DiscordLib>';
import { Shoukaku } from '../Shoukaku';
import { NodeOptions } from '../Constants';
import { GetterObj } from './Constants';

export class <DiscordLib> {
    constructor(
        client: <ClientClass>
    );
    public getters(): GetterObj;
    public build(shoukaku: Shoukaku, nodes: NodeOptions): GetterObj;
}
```
