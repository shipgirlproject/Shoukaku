---
title: Connectors
---
# Connectors
## Supported libraries
### [Discord.JS](https://discord.js.org)
#### Supported versions
- v14.x.x
- v13.x.x

#### Usage
```ts
import { Shoukaku, Connectors } from 'shoukaku';
new Shoukaku(new Connectors.DiscordJS(client), servers, options);
```

### [Eris](https://abal.moe/Eris/)
#### Supported versions
- 0.17.x
- 0.16.x
- 0.15.x

#### Usage
```ts
import { Shoukaku, Connectors } from 'shoukaku';
new Shoukaku(new Connectors.Eris(client), servers, options);
```

### [Oceanic.JS](https://oceanic.ws/)
#### Supported versions
- 1.0.x

#### Usage
```ts
import { Shoukaku, Connectors } from 'shoukaku';
new Shoukaku(new Connectors.OceanicJS(client), servers, options);
```

### [Seyfert](https://www.seyfert.dev/)
#### Supported versions
- 0.1.x

#### Usage
```ts
import { Shoukaku, Connectors } from 'shoukaku';
new Shoukaku(new Connectors.DiscordJS(client), servers, options);
```

## Creating connectors

```ts
import { Connector } from '../Connector';
import { NodeOption } from '../../Shoukaku';

export class DiscordJS extends Connector {
    // sendPacket is where your library send packets to Discord Gateway
    public sendPacket(shardId: number, payload: any, important: boolean): void {
        return this.client.ws.shards.get(shardId)?.send(payload, important);
    }
    // getId is a getter where the lib stores the client user (the one logged in as a bot) id
    public getId(): string {
        return this.client.user.id;
    }
    // Listen attaches the event listener to the library you are using
    public listen(nodes: NodeOption[]): void {
        // Only attach to ready event once, refer to your library for its ready event
        this.client.once('ready', () => this.ready(nodes));
        // Attach to the raw websocket event, this event must be 1:1 on spec with dapi (most libs implement this)
        this.client.on('raw', (packet: any) => this.raw(packet));
    }
}
```
