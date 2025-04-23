---
title: Getting Started
---
# Getting Started
> [!warning]
> Shoukaku runs on Node versions above `18.0.0` and NPM versions above `7.0.0`.
> Currently, Shoukaku is not tested or verified to run on the Deno runtime or the Bun runtime.

Shoukaku is a stable, powerful and updated wrapper around [Lavalink](https://lavalink.dev/). It is Discord library agnostic, and can add support for new Discord libraries using connectors.

## Set up Shoukaku
1. Install Shoukaku using your favorite package manager.

```console
npm i shipgirlproject/Shoukaku#master
```

2. Import the library

```ts
import { Client } from "discord.js";
import { Shoukaku, Connectors } from "shoukaku";
```

3. Configure nodes

```ts
const Nodes = [
    {
        name: "Localhost",
        url: "localhost:6969",
        auth: "re_aoharu", // password
    },
];
```

4. Initialize the library using one of the connectors.

**Discord.js**
```ts
const client = new Client();
const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);
```

**Eris**
```ts
const client = new Client();
const shoukaku = new Shoukaku(new Connectors.Eris(client), Nodes);
```

**Oceanic.js**
```ts
const client = new Client();
const shoukaku = new Shoukaku(new Connectors.OceanicJS(client), Nodes);
```

**Seyfert**
```ts
const client = new Client();
const shoukaku = new Shoukaku(new Connectors.Seyfert(client), Nodes);
```

> [!important]
> Shoukaku will never initialized if you don't start her before you call `client.login()`
> ```ts
> client.on('ready', () => {
>     client.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);
> });
> ```

5. Handle error events

Always handle "error" events or your program may crash due to uncaught error
```ts
shoukaku.on("error", (_, error) => console.error(error));
```

6. Login to Discord

    ```ts
    client.login("token");
    ```

> [!tip]
> If you want shoukaku to be available on client, then bind it to it
> ```ts
> client.shoukaku = shoukaku;
> ```

## Other Resources

- [Lavalink Docs](https://lavalink.dev)
- Example implementation using Discord.JS: [Kongou](https://github.com/Deivu/Kongou)
- Get support on the [Discord server](https://discord.gg/FVqbtGu)
