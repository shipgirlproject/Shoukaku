## Shoukaku

> A stable and updated wrapper around Lavalink

[![Discord](https://img.shields.io/discord/423116740810244097?style=flat-square)](https://discordapp.com/invite/FVqbtGu)
[![npm](https://img.shields.io/npm/v/shoukaku?style=flat-square)](https://www.npmjs.com/package/shoukaku)
![Github Stars](https://img.shields.io/github/stars/Deivu/Shoukaku?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues-raw/Deivu/Shoukaku?style=flat-square)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/shoukaku?style=flat-square) 
![NPM](https://img.shields.io/npm/l/shoukaku?style=flat-square)

<p align="center">
    <img src="https://azurlane.netojuu.com/images/6/69/Shoukaku.png"> 
</p>

> The ShipGirl Project, feat Shoukaku; ⓒ Azur Lane 

### Features

✅ Stable

✅ Documented

✅ Updated

✅ Extendable

✅ ESM & CommonJS supported

✅ Very cute (Very Important)

### Supported Libraries

Refer to [/src/connectors](https://github.com/Deivu/Shoukaku/tree/master/src/connectors) for list of supported libraries + how to support other libraries

### Installation

*   Stable (3.x.x) | Needs Lavalink Versions: `"3.5.x" < "3.9.x" >`

> `npm install shoukaku`

*   Dev (4.0.0-dev) | Needs Lavalink Versions: `"4.x.x <"`

> `npm install https://github.com/Deivu/Shoukaku.git`

> Lavalink v4 support is currently deployed on master branch, do `npm install https://github.com/Deivu/Shoukaku.git`

> Dev versions are not guaranteed to stay the same api wise, and even with last known stable, I won't say it's 100% stable

### Documentation

https://deivu.github.io/Shoukaku/ (Stable v3 version only)

https://github.com/Deivu/Shoukaku/tree/v3 (v3 stable github branch)

> v4.x.x docs are in your intellisense for now (I only deploy stable release docs on the Github page)

### Small code snippet examples

> Initializing the library (Using Connector Discord.JS)
```js
const { Client } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');
const Nodes = [{
    name: 'Localhost',
    url: 'localhost:6969',
    auth: 'marin_kitagawa'
}];
const client = new Client();
const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);
// ALWAYS handle error, logging it will do
shoukaku.on('error', (_, error) => console.error(error));
client.login('token');
// If you want shoukaku to be available on client, then bind it to it, here is one example of it
client.shoukaku = shoukaku;
```

> Never initialize Shoukaku like this, or else she will never initialize, start shoukaku before you call `client.login()`
```js
// NEVER DO THIS, OR SHOUKAKU WILL NEVER INITIALIZE
client.on('ready', () => {
    client.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);
});
```

> Join a voice channel, search for a track, play the track, then disconnect after 30 seconds
```js
const player = await shoukaku.joinVoiceChannel({
    guildId: 'your_guild_id',
    channelId: 'your_channel_id',
    shardId: 0 // if unsharded it will always be zero (depending on your library implementation)
});
// player is created, now search for a track
const result = await player.node.rest.resolve('scsearch:snowhalation');
if (!result?.tracks.length) return;
const metadata = result.tracks.shift();
// play the searched track
await player.playTrack({ track: metadata.encoded });
// disconnect after 30 seconds
setTimeout(() => shoukaku.leaveVoiceChannel(player.guildId), 30000).unref();
```

> Playing a track and changing a playback option (in this example, volume)
```js
await player.playTrack({ track: metadata.encoded });
await player.setGlobalVolume(50);
```

> Updating the whole player if you don\'t want to use my helper functions
```js
await player.update({ ...playerOptions });
```

> Setting a custom get node ideal function
```js
const player = await shoukaku.joinVoiceChannel({
    guildId: 'your_guild_id',
    channelId: 'your_channel_id',
    shardId: 0,
    getNode: (nodes, connection) => { 
        nodes = [ ...nodes.values() ];
        return nodes.find(node => node.group === connection.region);
    }
});
```

### Updating from V3 -> V4 (notable changes)

> The way of joining and leaving voice channels is now different
```js
const { Client } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');
const Nodes = [{
    name: 'Localhost',
    url: 'localhost:6969',
    auth: 'marin_kitagawa'
}];
const client = new Client();
const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);
shoukaku.on('error', (_, error) => console.error(error));
client.login('token');
client.once('ready', async () => {
    // get a node with least load to resolve a track
    const node = shoukaku.getIdealNode();
    const result = await node.rest.resolve('scsearch:snowhalation');
    if (!result?.tracks.length) return;
    // we now have a track metadata, we can use this to play tracks
    const metadata = result.tracks.shift();
    // you now join a voice channel by querying the main shoukaku class, not on the node anymore
    const player = await shoukaku.joinVoiceChannel({
        guildId: 'your_guild_id',
        channelId: 'your_channel_id',
        shardId: 0 // if unsharded it will always be zero (depending on your library implementation)
    });
    // if you want you can also use the player.node property after it connects to resolve tracks
    const result_2 = await player.node.rest.resolve('scsearch:snowhalation');
    console.log(result_2.tracks.shift());
    // now we can play the track
    await player.playTrack({ track: metadata.encoded });
    setTimeout(async () => {
        // simulate a timeout event, after specific amount of time, we leave the voice channel
        // you now destroy players / leave voice channels by calling leaveVoiceChannel in main shoukaku class
        await shoukaku.leaveVoiceChannel(player.guildId);
    }, 30000);
})
```

> Usual player methods now return promises
```js
await player.playTrack(...data);
await player.stopTrack();
```

> There are 2 kinds of volumes you can set, global and filter
```js
// global volume accepts 0-1000 as it's values
await player.setGlobalVolume(100);
// to check the current global volume
console.log(player.volume);
// filter volume accepts 0.0-5.0 as it's values
await player.setFilterVolume(1.0);
// to check the current filter volume (filters.volume can be undefined)
console.log(player.filters.volume)
```

> There are other internal changes like 
```js
// new variable in shoukaku class, which handles the "connection data" of discord only
console.log(shoukaku.connections);
// getNode() is removed in favor of joinVoiceChannel custom get node function, example:
const player = await shoukaku.joinVoiceChannel({
    guildId: 'your_guild_id',
    channelId: 'your_channel_id',
    shardId: 0,
    getNode: (nodes, connection) => {
        nodes = [ ...nodes.values() ];
        return nodes.find(node => node.group === connection.region);
    }
});
// you can still get the least loaded node to resolve tracks via getIdealNode();
console.log(shoukaku.getIdealNode());
// and other changes I'm not able to document(?);
```

### Shoukaku's options
| Option                 | Type                   | Description                                                                                                                                          |
|------------------------|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| resume                 | boolean                | Whether to resume a connection on disconnect to Lavalink (Server Side) (Note: DOES NOT RESUME WHEN THE LAVALINK SERVER DIES)                         |
| resumeTimeout          | number                 | Timeout before resuming a connection **in seconds**                                                                                                  |
| resumeByLibrary        | boolean                | Whether to resume the players by doing it in the library side (Client Side) (Note: TRIES TO RESUME REGARDLESS OF WHAT HAPPENED ON A LAVALINK SERVER) |
| reconnectTries         | number                 | Number of times to try and reconnect to Lavalink before giving up                                                                                    |
| reconnectInterval      | number                 | Timeout before trying to reconnect **in seconds**                                                                                                    |
| restTimeout            | number                 | Time to wait for a response from the Lavalink REST API before giving up **in seconds**                                                               |
| moveOnDisconnect       | boolean                | Whether to move players to a different Lavalink node when a node disconnects                                                                         |
| userAgent              | string                 | User Agent to use when making requests to Lavalink                                                                                                   |
| structures             | Object{rest?, player?} | Custom structures for shoukaku to use                                                                                                                |
| voiceConnectionTimeout | number                 | Timeout before abort connection **in seconds**                                                                                                       |

### Plugins list

> Open a pr to add your plugin here

| Name         | Link                                              | Description                                                                                                                              |
|--------------|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Kazagumo     | [Github](https://github.com/Takiyo0/Kazagumo)     | A Shoukaku wrapper that have built-in queue system                                                                                       |
| stone-deezer | [NPM](https://www.npmjs.com/package/stone-deezer) | A plugin to simplify deezer links and then play it from available sources (**REQUIRES [KAZAGUMO](https://github.com/Takiyo0/Kazagumo)**) |

### Other Links

[Support](https://discord.gg/FVqbtGu) (#Development) | [Lavalink](https://github.com/freyacodes/Lavalink)

### Implementation (Discord.JS)
> [Kongou](https://github.com/Deivu/Kongou)

### Made with ❤ by
> @Sāya#0113
