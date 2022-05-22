## Shoukaku's Supported Libs

> [Discord.JS](https://discord.js.org/#/) (v13.x.x & 14.0.0-dev.1652573522-7ce641d)

```js
const { Shoukaku, Connectors } = require('shoukaku');
new Shoukaku(new Connectors.DiscordJS(client), servers, options);
```

> [Eris](https://abal.moe/Eris/) (0.15.x / 0.15.x-dev)

```js
const { Shoukaku, Connectors } = require('shoukaku');
new Shoukaku(new Connectors.Eris(client), servers, options)
```

> Implement your own 

## Implementing your own

> Check **DiscordJS.js** or **Eris.js** inside libs folder for a detailed explanation on how to support a library

> And Submit a PR so other people don't need to do it themselves, yay!

## Support

For questions on how to do so, just ask at my support server at [HERE](https://discord.gg/FVqbtGu) (#Development)
