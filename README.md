## Shoukaku
[![Discord](https://img.shields.io/discord/423116740810244097?style=flat-square)](https://discordapp.com/invite/FVqbtGu)
[![npm](https://img.shields.io/npm/v/shoukaku?style=flat-square)](https://www.npmjs.com/package/shoukaku)
![Github Stars](https://img.shields.io/github/stars/Deivu/Shoukaku?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues-raw/Deivu/Shoukaku?style=flat-square)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/shoukaku?style=flat-square) 
![NPM](https://img.shields.io/npm/l/shoukaku?style=flat-square)
<p align="center">
  <img src="https://vignette.wikia.nocookie.net/kancolle/images/c/c8/Shoukaku_Full.png/revision/latest">
</p>

The ShipGirl Project. Shoukaku `(c) Kancolle for Shoukaku`

### A Full Blown Lavalink Wrapper designed around Discord.js v12

✅ Currently being used by: 

[![DBL](https://discordbots.org/api/widget/424137718961012737.svg)](https://discordbots.org/bot/424137718961012737)

### Why Shoukaku?
✅ Designed to used in Discord.JS v12

✅ Straightforward, Maintained, and Reliable.

✅ Stable for long term usage.

✅ Offers features that other libraries don't have.

✅ Very cute and reliable Shipgirl ❤ (Important)

### Documentation
https://deivu.github.io/Shoukaku/?api

### Installation
For Stable
```
npm i shoukaku
```
For Master
```
npm i Deivu/Shoukaku
```

### Changelogs
You can view it on [CHANGELOGS.MD](https://github.com/Deivu/Shoukaku/blob/master/CHANGELOGS.MD) file in this repository.

### Support Server
If you need help on using this, Join Here [ShipGirls Community](https://discordapp.com/invite/FVqbtGu) and `ask at #support`. 

### Issue / Bug Found?
Feel free to open an issue in the [Issues](https://github.com/Deivu/Shoukaku/issues) section of this repository.

### Notes 
> If you want to help in development, you can use the wrapper and report the issues you experienced on using it, or Submit a PR if you think you can improve something.

> There is a Discord.JS actual implementation and a simple implementation examples below.

### Starting a Lavalink Server.
[View Lavalink README here](https://github.com/Frederikam/Lavalink/blob/master/README.md)

### Discord.js actual implementation.
[View Kongou's source code here](https://github.com/Deivu/Kongou)

### Really simple example of using this.
```js
const { Client } = require('discord.js');
const { Shoukaku } = require('shoukaku');
const MyLavalinkServer = [{
    name: 'Lewd Server',
    host: 'localhost',
    port: 6969,
    auth: 'do not guess my password'
}];
const client = new Client();

// In this example, I will assign Shoukaku to a carrier variable. Options are the default options if nothing is specified
const Carrier = new Shoukaku(client, {
  moveOnDisconnect: false,
  resumable: false,
  resumableTimeout: 30,
  reconnectTries: 2,
  restTimeout: 10000 
});

// Listeners you can use for Shoukaku
Carrier.on('ready', (name) => console.log(`Lavalink Node: ${name} is now connected`));
// Error must be handled
Carrier.on('error', (name, error) => console.log(`Lavalink Node: ${name} emitted an error.`, error));
// Close emits when a lavalink node disconnects.
Carrier.on('close', (name, code, reason) => console.log(`Lavalink Node: ${name} closed with code ${code}. Reason: ${reason || 'No reason'}`));
// Disconnected emits when a lavalink node disconnected and will not try to reconnect again.
Carrier.on('disconnected', (name, reason) => console.log(`Lavalink Node: ${name} disconnected. Reason: ${reason || 'No reason'}`));

client.on('ready', () => {
  // Connecting Shoukaku to Lavalink Nodes.
  Carrier.start(MyLavalinkServer, { id: client.user.id  });
  console.log('Bot Initialized');
})

// Now I will show you how to make a simple handler that plays a link on your chnanel. Async Await style
client.on('message', async (msg) => {
  if (msg.author.bot || !msg.guild) return;
  if (msg.content.startsWith('$play')) {

    // Check if there is already a link on your guild. Since this is a no queue implementation.
    if (Carrier.getPlayer(msg.guild.id)) return;

    const args = msg.content.split(' ');
    if (!args[1]) return;

    // Getting a node where we can peform our queries and connections.
    const node = Carrier.getNode();

    // Fetching the Lavalink Track Data from the node we got.
    let data = await node.rest.resolve(args[1]);

    // If there is no data lets just return
    if (!data) return;

    if (Array.isArray(data)) data = data[0];

    // Getting the ShoukakuPlayer where we can play tracks and disconnect once we dont need it anymore.
    const player = await node.joinVoiceChannel({
      guildID: msg.guild.id,
      voiceChannelID: msg.member.voice.channelID
    });
    
    // Example of handling the non optional events.
    const endFunction = (param) => {
        console.log(param);
        player.disconnect();
    }
    player.on('end', endFunction);
    player.on('closed', endFunction);
    player.on('error', endFunction);
    player.on('nodeDisconnect', endFunction);

    // Play the lavalink track we got
    await player.playTrack(data.track);
    await msg.channel.send("Now Playing: " + data.info.title);
  }
})
client.login('token');
```
