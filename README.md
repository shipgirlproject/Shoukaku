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

> Warning: ⚠️ If you are looking for stable release => https://github.com/shipgirlproject/Shoukaku/tree/v4

> Info: ℹ️ Last v4 commit in master if you insist on using master => https://github.com/shipgirlproject/Shoukaku/commit/5c0be0eb0dab8dfd840fd0b3290d03fb841f0615

> Info: ℹ️ The next version (v5) can be the last breaking change library wise unless Lavalink makes a change in it's core api

### Getting Started (Using Discord.JS and a very long example code)

```js
import { Client } from 'discord.js';
import { Shoukaku, Player, Events, createDiscordJSOptions } from 'shoukaku';

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
const optionalOptions = {};

const shoukaku = new Shoukaku(requiredOptions, optionalOptions);

const caches = new Map();

// always log error to avoid unhandled errors
shoukaku.on(Events.Error, console.error);

// any of the ff: TrackStartEvent | TrackEndEvent | TrackStuckEvent | TrackExceptionEvent | WebSocketClosedEvent
shoukaku.on(Events.PlayerEvent, event => {
    const cache = caches.get(event.guildId);
    
    if (event.type === PlayerEventType.TrackStartEvent) {
        player.channel
            .send(`Now playing: ${event.track.info.title}`)
            .catch(console.error);
    }
    
    if (event.type === PlayerEventType.WebsocketClosedEvent) {
        shoukaku.leaveVoiceChannel(event.guildId);
        caches.delete(event.guildId);
    }
    
    console.log(`An event occured at guild id: ${event.guildId} data => ${JSON.stringify(event)}`)
});

// in an event of disconnection, if moveOnDisconnect is enabled, shoukaku will automatically handle node moving but disconnect players that aren't moved
// hence you need to compare your own cache and shoukaku.connection cache, and remove players that dont exist on your cache.
// lucky for you if you use my basic wrapper around player, you can just check if connection prop exists!
shoukaku.on(Events.Disconnect, () => {
    for (const cache of caches) {
        if (!cache.player.connection.deref())
            caches.delete(cache.player.guildId);
    }
});

// you need to call connect for shoukaku to connect the nodes before you try anything
shoukaku.connect();

client.login(process.env.TOKEN);

client.on("message", async message => {
    if (message.content.startsWith("!play")) {
        const input = message.content.split(" ")[1];

        if (!input)
            return message.channel.send("No track to load");

        if (!message.member.voice.channelId)
            return message.channel.send("Not in a voice channel");

        const node = shoukaku.getIdealNode();
        
        if (!node)
            return message.channel.send("No nodes available");

        const track = await node.rest.resolve(input);

        const connection = await shoukaku.joinVoiceChannel({
            node,
            guildId: message.guild.id,
            shardId: message.guild.shardId,
            channelId: message.member.voice.channelId
        });

        // You now create your own player class! This is a basic wrapper around "player" and you can use it as basis for yours
        const player = new Player(connection);

        caches.set(message.guild.id, { channel: message.channel, player });

        return player.playTrack({
            track: {
                encoded: track.data.encoded
            }
        });
    }
    
    if (message.content.startsWith("!stop")) {
        shoukaku.leaveVoiceChannel(message.guild.id);

        return message.channel.send("Ok!");
    }
});
```

> More examples coming soon!

### Required Configuration Options
| Option                 | Type                   | Description                                                     |                                 
| ---------------------- | ---------------------- | --------------------------------------------------------------- | 
| userId                 | string                 | The user id (bot) that shoukaku will use to connect             |                          
| nodes                  | NodeOption[]           | List of initial nodes to use                                    |
| connectionOptions      | ConnectorOptions       | Connector options Shoukaku will use to connect, see above       |

### Optional Configuration Options

| Option                 | Type                   | Default  | Description                                                                                      | Notes                                                           |
| ---------------------- | ---------------------- | -------- | ------------------------------------------------------------------------------------------------ |-----------------------------------------------------------------|
| resume                 | boolean                | false    | If you want to enable resuming when your connection when your connection to lavalink disconnects |                                                                 |
| resumeTimeout          | number                 | 30       | Timeout before lavalink destroys the players on a disconnect                                     | In seconds                                                      |
| reconnectTries         | number                 | 3        | Number of tries to reconnect to lavalink before disconnecting                                    |                                                                 |
| reconnectDelay         | number                 | 5        | Timeout between reconnects                                                                       | In seconds                                                      |
| restTimeout            | number                 | 60       | Maximum amount of time to wait for rest lavalink api requests                                    | In seconds                                                      |
| moveOnDisconnect       | boolean                | false    | Whether to move players to a different lavalink node when a node disconnects                     | Set this to false if you want to clean the connections yourself |
| userAgent              | string                 | (auto)   | Changes the user-agent used for lavalink requests                                                | Not recommeded to change                                        |
| structures             | Object{rest?, player?} | {}       | Custom structures for shoukaku to use                                                            |                                                                 |
| voiceConnectionTimeout | number                 | 15       | Maximum amount of time to wait for a join voice channel command                                  | In seconds                                                      |
| nodeResolver           | function               | function | Custom node resolver if you want to have your own method of getting the ideal node               |                                                                 |

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