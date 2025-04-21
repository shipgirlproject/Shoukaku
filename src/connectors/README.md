## In order to use Shoukaku, you need to provide any class that extends Connector. Here are some examples

> [Discord.JS](https://discord.js.org/#/)

```js
import { Shoukaku, Connector } from 'shoukaku';
import { Client } from 'discord.js';

// Lavalink servers array
const nodes = [];
// Shoukaku options
const options = {};

const client = new Client();

const shoukaku = new Shoukaku(, [], {});

shoukaku.connect();
client.login(token);
```

> [Eris](https://abal.moe/Eris/)

```js
import { Shoukaku, Connector } from 'shoukaku';
import { Client, } from 'discord.js';

class DiscordJsConnector extends Connector<Client> {
	public sendPacket(shardId: number, payload: any, important: boolean): void {
		return this.client.ws.shards.get(shardId)?.send(payload, important);
	}
}

// Lavalink servers array
const nodes = [];
// Shoukaku options
const options = {};

const client = new Client();

const shoukaku = new Shoukaku(new DiscordJsConnector(client), [], {});

shoukaku.connect();
client.login(token);
```

```js
const { Shoukaku, Connectors } = require('shoukaku');
new Shoukaku(new Connectors.Eris(client), servers, options)
```

> [Oceanic.JS](https://oceanic.ws/) (1.0.x)

```js
const { Shoukaku, Connectors } = require('shoukaku');
new Shoukaku(new Connectors.OceanicJS(client), servers, options)
```

> [Seyfert](https://seyfert-docs.vercel.app/) (0.1.x)

```js
const { Shoukaku, Connectors } = require('shoukaku');
new Shoukaku(new Connectors.Seyfert(client), servers, options)
```


> Implement your own 

## Implementing your own

> Check **DiscordJS.ts** or **Eris.ts** inside libs folder for a detailed explanation on how to support a library

> And Submit a PR so other people don't need to do it themselves, yay!

## Support

For questions on how to do so, just ask at my support server at [HERE](https://discord.gg/FVqbtGu) (#Development)
