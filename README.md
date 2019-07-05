# Shoukaku
<p align="center">
  <img src="https://vignette.wikia.nocookie.net/kancolle/images/9/97/Shoukaku_Christmas_Full.png/revision/latest/">
</p>

The ShipGirl Project. Shoukaku `(c) Kancolle for Shoukaku`

### A Full Blown Lavalink Wrapper designed around Discord.js v12

Currently being used by [Kashima](https://discordbots.org/bot/kashima-is-a-good-girl)

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

### Support Server
If you need help on using this, Join Here [ShipGirls Community](https://discordapp.com/invite/FVqbtGu) and `ask at #support`. 

### Issue / Bug Found?
Feel free to open an issue in the [Issues](https://github.com/Deivu/Shoukaku/issues) section of this repository.

### Notes 
> If you want to help in development, you can use the wrapper and report the issues you experienced on using it, or Submit a PR if you think you can improve something.

> There is a Discord.JS actual implementation and a simple implementation examples below.

### Task List
- [x] Base Logic
- [x] Player & Voice Logic 
- [x] Load Balancing Logic
- [x] Node Removal Logic
- [x] Reconnect Logic
- [x] Resuming Logic
- [x] Documentation
- and some more to come.

### Starting a Lavalink Server.
[View Lavalink README here](https://github.com/Frederikam/Lavalink/blob/master/README.md)

### Discord.js actual implementation. 
[View Kongou's source code here](https://github.com/Deivu/Kongou)

### More simple implementation w/o queue.
```js
const { Client } = require('discord.js');
const { Shoukaku } = require('shoukaku');
const MyLavalinkServer = [
  {
    name: 'my_lavalink_server',
    host: 'localhost',
    port: 6969,
    auth: 'owo_your_password'
  }
];
const client = new Client();

// In this example, I will assign Shoukaku to a carrier variable. Options are the default options if nothing is specified
const Carrier = new Shoukaku(client, {
  resumable: false,
  resumableTimeout: 30,
  reconnectTries: 2,
  restTimeout: 10000 
});
// Attach listeners, currently this are the only listeners available
Carrier.on('ready', (name) => console.log(`Lavalink Node: ${name} is now connected`));
// Error must be hanndled
Carrier.on('error', (name, error) => console.log(`Lavalink Node: ${name} emitted an error.`, error));
// Close emits when a lavalink node disconnects.
Carrier.on('close', (name, code, reason) => console.log(`Lavalink Node: ${name} closed with code ${code}. Reason: ${reason || 'No reason'}`));
// Disconnected emits when a lavalink node disconnected and will not try to reconnect again.
Carrier.on('disconnected', (name, reason) => console.log(`Lavalink Node: ${name} disconnected. Reason: ${reason || 'No reason'}`));

client.on('ready', () => {
  // You need to build shoukaku on your client's ready event for her to work like how its done in this example.
  Carrier.build(MyLavalinkServer, { id: client.user.id  });
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
    // These are the events you can handle, exception can be ignored, while the other 4 should be handled.
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
      // Make sure you log the reason because it may be an error.
      console.log(reason);
      // There is no more reason for us to do anything so lets just clean up in voiceClose event
      link.disconnect();
    });
    link.player.on('nodeDisconnect', () => {
      // You still need to clean your link when player.on 'nodeDisconnect' fires. This means the node that governs this link disconnected.
      link.disconnect();
    });

    // Play the lavalink track we got
    await link.player.playTrack(data.track);
    await msg.channel.send("Now Playing: " + data.info.title);
  }
})
client.login('token');
```