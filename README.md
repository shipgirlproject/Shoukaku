## Shoukaku

> A low level Node.JS Library around Lavalink

[![Discord](https://img.shields.io/discord/423116740810244097?style=flat-square)](https://discordapp.com/invite/FVqbtGu)
[![npm](https://img.shields.io/npm/v/shoukaku?style=flat-square)](https://www.npmjs.com/package/shoukaku)
![Github Stars](https://img.shields.io/github/stars/Deivu/Shoukaku?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues-raw/Deivu/Shoukaku?style=flat-square)
![NPM](https://img.shields.io/npm/l/shoukaku?style=flat-square)

<p align="center">
    <img src="https://azurlane.netojuu.com/images/thumb/d/dc/ShoukakuWeddingWithoutBG.png/767px-ShoukakuWeddingWithoutBG.png"> 
</p>

> Artwork from Azur Lane

### Features

- Stable

- Updated

- Documented

- Extendable

- ESM & CommonJS supported

- Very cute (Very Important)

> Warning: ⚠️ If you are looking for Stable Branch, Look at the v4 Branch of the Library. Master is v5 bleeding edge 

> Info: ℹ️ v5 maybe is the last breaking change library wise unless Lavalink makes a change in it's core api

### Getting Started

```js
import { Client } from 'discord.js';
import { Shoukaku, Events, createDiscordJSOptions } from 'shoukaku';

const client = new Client();

// see below for more info
const requiredOptions = {
    userId: "12345678901234567890",
    nodes: [{
        name: "Local",
        url: "127.0.0.1:8080",
        auth: "Something is rising and it's the Shield Hero"
    }],
    connectionOptions: createDiscordJsOptions(client)
};

// see below for more info
const optionalOptions = {
    userAgent: "Rio/1.0.0"
};

const shoukaku = new Shoukaku(requiredOptions, optionalOptions);

shoukaku.on(Events.Error, console.error);

shoukaku.on(Events.Disconnect, node => {
    shoukaku.connections
        .filter(c => node.connections.has(c))
        .forEach(c => c.disconnect());
});

shoukaku.connect();

client.login(env.TOKEN);
```

> https://github.com/Deivu/Kongou
### Required Configuration Options
| Option                 | Type                   | Description                                                     |                                 
| ---------------------- | ---------------------- | --------------------------------------------------------------- | 
| userId                 | string                 | The user id (bot) that shoukaku will use to connect             |                          
| nodes                  | NodeOption[]           | List of initial nodes to use                                    |
| connectionOptions      | ConnectorOptions       | Connector options Shoukaku will use to connect, see above       |

### Optional Configuration Options

| Option                 | Type                   | Default  | Description                                                                                      | Notes                    |
| ---------------------- | ---------------------- | -------- | ------------------------------------------------------------------------------------------------ | ------------------------ |
| resume                 | boolean                | false    | If you want to enable resuming when your connection when your connection to lavalink disconnects |                          |
| resumeTimeout          | number                 | 30       | Timeout before lavalink destroys the players on a disconnect                                     | In seconds               |
| reconnectTries         | number                 | 3        | Number of tries to reconnect to lavalink before disconnecting                                    |                          |
| reconnectDelay         | number                 | 5        | Timeout between reconnects                                                                       | In seconds               |
| restTimeout            | number                 | 60       | Maximum amount of time to wait for rest lavalink api requests                                    | In seconds               |
| moveOnDisconnect       | boolean                | false    | Whether to move players to a different lavalink node when a node disconnects                     |                          |
| userAgent              | string                 | (auto)   | Changes the user-agent used for lavalink requests                                                | Not recommeded to change |
| structures             | Object{rest?, player?} | {}       | Custom structures for shoukaku to use                                                            |                          |
| voiceConnectionTimeout | number                 | 15       | Maximum amount of time to wait for a join voice channel command                                  | In seconds               |
| nodeResolver           | function               | function | Custom node resolver if you want to have your own method of getting the ideal node               |                          |

### Wrappers

| Name     | Link                                          | Description                                              |
| -------- | --------------------------------------------- | -------------------------------------------------------- |
| Kazagumo | [Github](https://github.com/Takiyo0/Kazagumo) | A wrapper for Shoukaku that has an internal queue system |

> Open a pr if you want to add a wrapper here

### Other Links

- [Discord](https://discord.gg/FVqbtGu)

- [Lavalink](https://github.com/lavalink-devs/Lavalink)

### Code made with ❤ by @ichimakase (Saya)

> The Shipgirl Project