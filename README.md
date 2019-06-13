# Shoukaku
<p align="center">
  <img src="https://vignette.wikia.nocookie.net/kancolle/images/9/97/Shoukaku_Christmas_Full.png/revision/latest/">
</p>
The ShipGirl Project. Shoukaku. `(c) Kancolle for Shoukaku`.

### A Full Blown Lavalink Wrapper designed around Discord.js v12

### Saya Note:
> This wrapper is still in alpha stage and idk, probably some features are bugged, but that doesn't mean it isn't usable. If you want to help in development, you can use the wrapper and report the issues you experienced on using it, or Submit a PR if you think you can improve something.

> Documentation is not yet available as of now, but I will soon:tm:

> Look at the Example Usage for an idea on what to see in this library

### Installation
```
npm i Deivu/Shoukaku
```

### Example Usage
```js
const { Client } = require('discord.js');
const { Shoukaku, ShoukakuResolver } = require('shoukaku');

// Your Discord.js Client
const Kongou = new Client();
//

// Manager of the nodes and players
const manager = new Shoukaku(
    // Your Discord.js client
    Kongou, 
    // Options you can customize for Shoukaku Manager.
    {
        resumable: true, // Defaults to false
        resumableTimeout: 15, // Defaults to 30
        resumekey: 'Kongou', // Defaults to resumable
        reconnectInterval: 5000, // Defaults to 10000
        reconnectTries: 3, // Defaults to 2
        handleNodeDisconnects: true // Defaults to true
    }
);
//

// Resolver for lavalink tracks
// Node data here is same on manager.buildManager but instead it only holds one host.
// Accepts an object for its properties, not an array.
const resolver = new ShoukakuResolver({
    // Host to use for shoukaku resolver
    host: 'localhost',
    // Port to use for shoukaku resolver
    port: 6969,
    // Rest password for shoukaku resolver
    auth: 'ur_a_qt_weeb'
});
//

// Manager Events that you can use. 
// YOU MUST HANDLE nodeError EVENT
manager.on('nodeReady', (host) => console.log(`Node ${host} is now ready`));
manager.on('nodeStats', (data, host) => console.log(`Node ${host} sent a stats update`));
manager.on('nodeReconnecting', (host) => console.log(`Node ${host} is reconnecting`));
manager.on('nodeResumed', (host) => console.log(`Node ${host} is resumed`))
manager.on('nodeNewSession', (host) => console.log(`Node ${host} re-established a new session`))
manager.on('nodeError', (error, host) => console.log(`Node ${host} errored ${error}`))
manager.on('nodeDisconnect', (host) => console.log(`Node ${host} is disconnected`))
// 

Kongou.on('ready', () => {
    // Must be called in ready to initialize the manager
    manager.buildManager({
            // Bot's user id
            id: Kongou.user.id,
            // Bot's shard count
            shardCount: 1
        }, 
        // Below is an array of object contains host, port and auth from your lavalink instance
        [{ 
            host: 'localhost',
            port: 6969,
            auth: 'ur_a_qt_weeb'
        }]
    );
    //
    console.log('Bot is now ready');
})

Kongou.on('message', async (msg) => {
    if (msg.content.startsWith('$play')) {
        if (manager.players.has(msg.guild.id)) return;
        const args = msg.content.split(' ')
        if (!args[1]) return;

        // Built in track resolver in this library
        const resolved = await resolver.resolve(args.slice(1).join(' '));
        // 

        if (!resolved) return;
        console.log(resolved);

        // Join Method. Makes the bot join the voice channel.
        // params: lavalink host, guild id, voice channel id
        const player = await manager.join('localhost', msg.guild.id, msg.member.voice.channel.id);

        // Lists of player events you can use
        player.on('playerEnd', () => {
            // Leave Method. Makes the bot leave the voice channel
            // params: guild id
            manager.leave(player.id).catch(console.error);
        });
        player.on('playerUpdate', console.log);
        player.on('playerError', console.log);
        player.on('playerClosed', console.log);
        player.on('playerNodeClosed', console.log);
        player.on('playerWarn', console.log);
        // 

        // Player Methods all returns a promise
        await player.play(resolved.track)
        /* 
        Other Player Methods you can use
        .setBands(Array of Bands)
        .seek(time to skip to)
        .pause() or .pause(false)
        .volume(0-999)
        .moveShoukakuNode(host, track, startTime in ms)
        .stop()
        .destroy()
        */
        
        await msg.channel.send('Playing' + resolved.info.title);
    }
})
Kongou.login('token');
```