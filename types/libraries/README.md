# Make your own Library Implementation Typings

Should follow this structure. Replace `<DiscordLib>` with your client of choice's name. Your typings file should also be named `<DiscordLib>.d.ts` and be placed inside the libraries folder. You should also edit the `index.d.ts` in libraries folder and export your Library Implementation Typings.
```ts
import { GetterObj, NodeOptions, Shoukaku } from "..";

export class <DiscordLib> {
    constructor(
        client: unknown
    );
    public client: unknown;
    public getters(): GetterObj;
    public build(shoukaku: Shoukaku, nodes: NodeOptions[]): GetterObj;
}
```
