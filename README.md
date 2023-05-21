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

*   Stable (3.x.x) (Needs Lavalink Versions: `3.5.x` < | `3.9.x` >)

> `npm install shoukaku`

*   Dev (4.0.0-dev) (Needs Lavalink Versions: `3.7.x` <)

> For living on the edge but with latest features: `npm install https://github.com/Deivu/Shoukaku.git`

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
> Searching and joining a channel (Async Function Implementation)
```js
const node = shoukaku.getNode();
if (!node) return;
const result = await node.rest.resolve('scsearch:snowhalation');
if (!result?.tracks.length) return;
const metadata = result.tracks.shift();
const player = await node.joinChannel({
    guildId: 'your_guild_id',
    channelId: 'your_channel_id',
    shardId: 0 // if unsharded it will always be zero (depending on your library implementation)
});
// player is created and ready, do your thing
```
> Playing a track and changing a playback option (in this example, volume)
```js
await player.playTrack({ track: metadata.encodedTrack });
await player.setVolume(0.5);
```

> Updating the whole player if you don\'t want to use my helper functions
```js
await player.update({ ...playerOptions });
```

### Shoukaku's options
 Option | Type | Description
--------|------|------------
resume | boolean | Whether to resume a connection on disconnect to Lavalink (Server Side) (Note: DOES NOT RESUME WHEN THE LAVALINK SERVER DIES) |
resumeKey | string | Resume key for Lavalink |
resumeTimeout | number | Timeout before resuming a connection **in seconds** |
resumeByLibrary | boolean | Whether to resume the players by doing it in the library side (Client Side) (Note: TRIES TO RESUME REGARDLESS OF WHAT HAPPENED ON A LAVALINK SERVER) |
alwaysSendResumeKey | boolean | Disables the first time initialization tracking of nodes, and just sends the resume key always (Note: Useful for people who save their players to redis and wants to resume sessions even at first boot) |
reconnectTries | number | Number of times to try and reconnect to Lavalink before giving up |
reconnectInterval | number | Timeout before trying to reconnect **in seconds** |
restTimeout | number | Time to wait for a response from the Lavalink REST API before giving up **in seconds** |
moveOnDisconnect | boolean | Whether to move players to a different Lavalink node when a node disconnects |
userAgent | string | User Agent to use when making requests to Lavalink |
structures | Object{rest?, player?} | Custom structures for shoukaku to use |
voiceConnectionTimeout | number | Timeout before abort connection **in seconds** |

### Plugins list

> Open a pr to add your plugin here

Name   | Link     | Description
-------|----------|------------
Kazagumo | [Github](https://github.com/Takiyo0/Kazagumo) | A Shoukaku wrapper that have built-in queue system 
stone-deezer | [NPM](https://www.npmjs.com/package/stone-deezer) | A plugin to simplify deezer links and then play it from available sources (**REQUIRES [KAZAGUMO](https://github.com/Takiyo0/Kazagumo)**)

### Other Links

[Support](https://discord.gg/FVqbtGu) (#Development) | [Lavalink](https://github.com/freyacodes/Lavalink)

### Implementation (Discord.JS)
> [Kongou](https://github.com/Deivu/Kongou)

### Made with ❤ by
> @Sāya#0113
