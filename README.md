# Shoukaku
<p align="center">
  <img src="https://vignette.wikia.nocookie.net/kancolle/images/9/97/Shoukaku_Christmas_Full.png/revision/latest/">
</p>

The ShipGirl Project. Shoukaku `(c) Kancolle for Shoukaku`

### A Full Blown Lavalink Wrapper designed around Discord.js v12

### Documentation
https://deivu.github.io/Shoukaku/?api

### Installation
```
npm i Deivu/Shoukaku
```

### Saya Note:
> The wrapper has entered the `beta` stage. 

> If you want to help in development, you can use the wrapper and report the issues you experienced on using it, or Submit a PR if you think you can improve something.

> There is a Discord.JS actual implementation and a simple implementation examples below.

### Task List
- [x] Base Logic
- [x] Playing Stopping Logic 
- [x] Load Balancing Logic
- [ ] Node Removal logic
- [x] Reconnect logic
- [x] Resuming Logic
- [x] Documentation
- and probably some things I forgot to mention?

### Discord.js actual implementation.
[View Kongou's Source Code Here](https://github.com/Deivu/Kongou)

### More simple implementation w/o queue.
```js
const { Client } = require('discord.js');
const { Shoukaku } = require('shoukaku');
const client = new Client();

// In this example, I will assign Shoukaku to a carrier variable. Options are the default options if nothing is specified
const Carrier = new Shoukaku(client, {
  resumable: false,
  resumableTimeout: 30,
  reconnectTries: 2,
  restTimeout: 10000 
});
// Attach listeners, currently this are the only listeners available
// on ERROR must be handled.
Carrier.on('ready', (name) => console.log(`Lavalink Node: ${name} is now connected`));
Carrier.on('error', (name, error) => console.log(`Lavalink Node: ${name} emitted an error.`, error));
Carrier.on('close', (name, code, reason) => console.log(`Lavalink Node: ${name} closed with code ${code}. Reason: ${reason || 'No reason'}`));

client.on('ready', () => {
  // You need to build shoukaku on your client's ready event for her to work like how its done in this example.
  Carrier.build([{
    name: 'my_lavalink_server',
    host: 'localhost',
    port: 6969,
    auth: 'I_Love_Anime_Weeb_69'
  }], { 
    id: client.user.id 
  });
  console.log('Bot Initialized');
})

// Now I will show you how to make a simple handler that plays a link on your chnanel. Async Await style
client.on('message', async (msg) => {
  if (msg.author.bot || !msg.guild) return;
  if (msg.content.startsWith('$play')) {

    // Check if there is already a link on your guild.
    if (Carrier.getLink(msg.guild.id)) return;

    const args = msg.content.split(' ');
    if (!args[1]) return;

    // Getting a node where we can peform our queries and connections.
    const node = Carrier.getNode();

    // Fetching the Lavalink Track Data from the node we got.
    let data = await node.rest.resolve(args[1]);

    // If there is no data lets just return
    if (!data) return;

    if (Array.isArray(data)) data = data[0];

    // Joining to a voice channel that returns the LINK property that we need.
    const link = await node.joinVoiceChannel({
      guildID: msg.guild.id,
      voiceChannelID: msg.member.voice.channelID
    });

    // link.player is our player class for that link, thats what we can use to play music
    link.player.on('end', (reason) => {
      console.log(reason);

      // Disconnect the link and clean everyting up
      link.disconnect();
    });
    link.player.on('exception', console.error);
    link.player.on('stuck', (reason) => {
      console.warn(reason);

      // In stuck event, end will not fire automatically, either we just disconnect or play another song
      link.disconnect();
    });
    link.player.on('voiceClose', (reason) => {
      console.log(reason);

      // There is no more reason for us to do anything so lets just clean up in voiceClose event
      link.disconnect();
    });

    // Play the lavalink track we got
    await link.player.playTrack(data.track);
    await msg.channel.send("Now Playing: " + data.info.title);
  }
})
client.login('token');
```