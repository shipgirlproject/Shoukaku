## Supported Libs

> [Discord.JS](https://discord.js.org/#/) (v13.x.x & 14.x.x)

```js
const { Shoukaku, Connectors } = require('shoukaku');
new Shoukaku(new Connectors.DiscordJS(client), servers, options);
```

> [Eris](https://abal.moe/Eris/) (0.15.x / 0.16.x / 0.17.x)

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
