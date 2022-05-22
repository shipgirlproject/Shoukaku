## Shoukaku

> A stable and updated wrapper around Lavalink

[![Discord](https://img.shields.io/discord/423116740810244097?style=flat-square)](https://discordapp.com/invite/FVqbtGu)
[![npm](https://img.shields.io/npm/v/shoukaku?style=flat-square)](https://www.npmjs.com/package/shoukaku)
![Github Stars](https://img.shields.io/github/stars/Deivu/Shoukaku?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues-raw/Deivu/Shoukaku?style=flat-square)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/shoukaku?style=flat-square) 
![NPM](https://img.shields.io/npm/l/shoukaku?style=flat-square)

<p align="center">
    <img src="https://cdn.donmai.us/original/0e/a4/0ea4a25416f850823d62d61ce51fc659.png" height="600"> 
</p>

> The ShipGirl Project, feat Shoukaku; ⓒ Kancolle
### Features

✅ Stable

✅ Documented

✅ Updated

✅ Extendable

✅ Very cute (Very Important)

### Supported Libraries

Refer to [/src/libraries](https://github.com/Deivu/Shoukaku/tree/master/src/libraries) for list of supported libraries + how to support other libraries

### Small code snippet examples
> Initializing the library (Using Connector Discord.JS)
```js
const { Client } = require('discord.js');
const { Shoukaku, Connector } = require('shoukaku');
const Nodes = [{
    name: 'Localhost',
    url: 'localhost:6969',
    auth: 'marin_kitagawa'
}];
const client = new Client();
const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);
// ALWAYS handle error
shoukaku.on('error', (_, error) => console.error(error));
client.login('token');
```
> Searching and joining a channel (Async Function Implementation)
```js
const node = shoukaku.getNode();
if (!node) return;
const result = await node.rest.resolve('scsearch:snowhalation');
if (!result?.tracks.length) return;
const metadata = result.tracks.shift();
const player = await node.joinVoiceChannel({
    guildId: 'your_guild_id',
    channelId: 'your_channel_id',
    shardId: 0 // if unsharded it will always be zero (depending on your library implementation)
});
// player is created and ready, do your thing
```
> Playing a track and changing a playback option (in this example, volume)
```js
player
    .playTrack(metadata.track)
    .setVolume(0.5);
```
### Plugins list

> Open a pr to add your plugin here

Name   | Link     | Description
-------|----------|------------
 ..... | ........ | ..........

### Creating Plugins
> Shoukaku has now official supports for plugins. However, implementing this is up to the developers that is interested on doing it

> Shoukaku support modification on Rest.ts and Player.ts

> To apply your plugin, put the extended classes on **ShoukakuOptions.structures**. Example below

```js
const { Client } = require('discord.js');
const { Shoukaku, Rest, Connector } = require('shoukaku');
class CustomRest extends Rest { }; // extended structure of your choice
const Nodes = [{
    name: 'Localhost',
    url: 'localhost:6969',
    auth: 'marin_kitagawa'
}];
const ShoukakuOptions = { structures: { rest: CustomRest } } // pass the custom structure at your rest parameter
const client = new Client();
const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes, ShoukakuOptions);
```
### Other Links

[Support](https://discord.gg/FVqbtGu) (#Development) | [Lavalink](https://github.com/freyacodes/Lavalink)

### Implementation (Discord.JS)
> https://github.com/Deivu/Kongou

### Made with ❤ by:
> @Sāya#0113
