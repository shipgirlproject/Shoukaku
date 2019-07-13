# Shoukaku
<p align="center">
  <img src="https://vignette.wikia.nocookie.net/kancolle/images/b/b3/Shoukaku_Christmas_Full_Damaged.png/revision/latest/">
</p>

The ShipGirl Project. Shoukaku `(c) Kancolle for Shoukaku`

### A Full Blown Lavalink Wrapper designed around Discord.js v12

✅ Currently being used by: 

[![DBL](https://discordbots.org/api/widget/424137718961012737.svg)](https://discordbots.org/bot/424137718961012737)

### Why Shoukaku?
✅ Straightforward 

✅ Scalable

✅ Reliable

✅ Maintained

✅ Very Cute and Charming Shipgirl ❤

✅ And will make your library weeb 😂

### Documentation "Documents the STABLE 0.1.1 not MASTER"
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

### 0.1.1 -> Master 0.2.0 Beta Migration
> ShoukakuLink is now a property of ShoukakuPlayer, meaning all link related getters are changed to player getters.

> You can access ShoukakuLink via .voiceConnection property of ShoukakuPlayer

> ShoukakuPlayer makes the playing, and disconnecting more easier since now it has .connect() and .disconnect() methods.

> ShoukakuPlayer events are "GREATLY CHANGED". Those marked as optional can be left out.
The events is as follows
- end
- closed
- error
- nodeDisconnect
- trackException "optional"
- resumed "optional"
- playerUpdate "optional"

> Shoukaku class have renamed methods and properties
- getLink() -> getPlayer()
- .links -> .players
- .totalLinks -> .totalPlayers

> Typings are also not updated to latest master.

You can see the changes on updated example below.

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

### Discord.js actual implementation. "Not yet updated to latest Master commit."
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
