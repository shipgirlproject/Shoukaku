# Shoukaku
<p align="center">
  <img src="https://vignette.wikia.nocookie.net/kancolle/images/9/97/Shoukaku_Christmas_Full.png/revision/latest/">
</p>
The ShipGirl Project. Shoukaku. `(c) Kancolle for Shoukaku`.

### A Full Blown Lavalink Wrapper designed around Discord.js v12

### Saya Note:
> This wrapper is still in alpha stage and idk, probably some features are bugged, but that doesn't mean it isn't usable. If you want to help in development, you can use the wrapper and report the issues you experienced on using it, or Submit a PR if you think you can improve something.

> Documentation is not yet available as of now, but I will soon:tm:

### Installation
```
npm i Deivu/Shoukaku
```

### Example Usage
```js
const { Client } = require('discord.js');
const { Shoukaku, ShoukakuResolver } = require('../Shoukaku/index.js');

const Kongou = new Client();
const manager = new Shoukaku(
    Kongou, {
        shardCount: 1,
        resumable: true,
        resumableTimeout: 15,
        resumekey: 'Kongou',
        reconnectInterval: 5000,
        reconnectTries: 3
    }
);
const resolver = new ShoukakuResolver({
    host: 'localhost',
    port: 6969,
    auth: 'ur_a_qt_weeb'
});

manager.on('nodeReady', (host) => console.log(`Node ${host} is now ready`));
manager.on('nodeStats', (data, host) => console.log(`Node ${host} sent a stats update`));
manager.on('nodeReconnecting', (host) => console.log(`Node ${host} is reconnecting`));
manager.on('nodeResumed', (host) => console.log(`Node ${host} is resumed`))
manager.on('nodeNewSession', (host) => console.log(`Node ${host} re-established a new session`))
manager.on('nodeError', (error, host) => console.log(`Node ${host} errored ${error}`))
manager.on('nodeDisconnect', (host) => console.log(`Node ${host} is disconnected`))

Kongou.on('ready', () => {
    manager.buildManager({
            id: Kongou.user.id,
            shardCount: 1
        }, [{
            host: 'localhost',
            port: 6969,
            auth: 'ur_a_qt_weeb'
        } 
    ])
    console.log('Bot is now ready');
})

Kongou.on('message', async (msg) => {
    if (msg.content.startsWith('$play')) {
        if (manager.players.has(msg.guild.id)) return;
        const args = msg.content.split(' ')
        if (!args[1]) return;
        const resolved = await resolver.resolve(args.slice(1).join(' '));
        if (!resolved) return;
        console.log(resolved);
        const player = await manager.join('amanogawa.moe', msg.guild.id, msg.member.voice.channel.id);
        player.on('playerEnd', () => {
            manager.leave(player.id).catch(console.error);
        });
        player.on('playerUpdate', console.log);
        await player.play(resolved.track);
        await msg.channel.send('Playing' + resolved.info.title);
    }
})
Kongou.login('token');
```