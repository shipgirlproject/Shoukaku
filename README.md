## Shoukaku
### A Lavalink wrapper for Discord.JS v12.x.x
[![Discord](https://img.shields.io/discord/423116740810244097?style=flat-square)](https://discordapp.com/invite/FVqbtGu)
[![npm](https://img.shields.io/npm/v/shoukaku?style=flat-square)](https://www.npmjs.com/package/shoukaku)
![Github Stars](https://img.shields.io/github/stars/Deivu/Shoukaku?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues-raw/Deivu/Shoukaku?style=flat-square)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/shoukaku?style=flat-square) 
![NPM](https://img.shields.io/npm/l/shoukaku?style=flat-square)

<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/0/00/Japanese_aircraft_carrier_shokaku_1941.jpg">
</p>

Japanese Navy Aircraft Carrier Shokaku type "Shokaku" immediately after completion photo `public domain`

### A Lavalink wrapper for Discord.js v12.x.x

✅ Currently being used by: 

[![DBL](https://discordbots.org/api/widget/424137718961012737.svg)](https://discordbots.org/bot/424137718961012737)

### Why Shoukaku?

✅ Straightforward

✅ Stable

✅ Feature-rich

✅ Very cute and reliable aircraft carrier ❤ (very, very important)

### Installation

```
npm i shoukaku@1.6.x // Replace x with the latest semver patch available
```

If you live on the edge, and want any update available on Shoukaku
```
npm i Deivu/Shoukaku
```


### Some useful info

> I don't plan to support Discord.JS v13 on 1.x.x versions of Shoukaku

> Discord.JS v13, and other libraries will & can be supported by 2.x.x of Shoukaku

> Shoukaku's 2.x.x is here: https://github.com/Deivu/Shoukaku/tree/next

### Documentation

> https://deivu.github.io/Shoukaku/?api

### Changelogs

> https://github.com/Deivu/Shoukaku/blob/master/CHANGELOGS.MD

### Getting Lavalink

Download binaries from the [CI server](https://ci.fredboat.com/viewLog.html?buildId=lastSuccessful&buildTypeId=Lavalink_Build&tab=artifacts&guest=1) or the [GitHub](https://github.com/freyacodes/Lavalink/releases) releases.

Put an [application.yml](https://github.com/freyacodes/Lavalink/blob/master/LavalinkServer/application.yml.example) file in your working directory.

Run with `java -jar Lavalink.jar`

Docker images are available on the [Docker](https://hub.docker.com/r/fredboat/lavalink/) hub.

### Other Links

[Support](https://discord.gg/FVqbtGu) | [Lavalink](https://github.com/freyacodes/Lavalink)

### Example

> Bot Implementation: https://github.com/Deivu/Kongou

> Basic Implementation:

```js
const { Client } = require('discord.js');
const { Shoukaku } = require('shoukaku');

const LavalinkServer = [{ name: 'Localhost', host: 'localhost', port: 6969, auth: 'big_weeb' }];
const ShoukakuOptions = { moveOnDisconnect: false, resumable: false, resumableTimeout: 30, reconnectTries: 2, restTimeout: 10000 };

class ExampleBot extends Client {
    constructor(opts) {
        super(opts);
        this.shoukaku = new Shoukaku(this, LavalinkServer, ShoukakuOptions);
    }

    login(token) {
        this._setupShoukakuEvents();
        this._setupClientEvents();
        return super.login(token);
    }

    _setupShoukakuEvents() {
        this.shoukaku.on('ready', (name) => console.log(`Lavalink ${name}: Ready!`));
        this.shoukaku.on('error', (name, error) => console.error(`Lavalink ${name}: Error Caught,`, error));
        this.shoukaku.on('close', (name, code, reason) => console.warn(`Lavalink ${name}: Closed, Code ${code}, Reason ${reason || 'No reason'}`));
        this.shoukaku.on('disconnected', (name, reason) => console.warn(`Lavalink ${name}: Disconnected, Reason ${reason || 'No reason'}`));
    }

    _setupClientEvents() {
        this.on('message', async (msg) => {
            if (msg.author.bot || !msg.guild) return;
            if (!msg.content.startsWith('$play')) return;
            if (this.shoukaku.getPlayer(msg.guild.id)) return;
            const args = msg.content.split(' ');
            if (!args[1]) return;
            const node = this.shoukaku.getNode();
            let data = await node.rest.resolve(args[1]);
            if (!data) return;
            const player = await node.joinVoiceChannel({
                guildID: msg.guild.id,
                voiceChannelID: msg.member.voice.channelID
            }); 
            player.on('error', (error) => {
                console.error(error);
                player.disconnect();
            });
            for (const event of ['end', 'closed', 'nodeDisconnect']) player.on(event, () => player.disconnect());
            data = data.tracks.shift();
            await player.playTrack(data); 
            await msg.channel.send("Now Playing: " + data.info.title);
        });
        this.on('ready', () => console.log('Bot is now ready'));
    }
}

new ExampleBot()
    .login('token')
    .catch(console.error);
```

> Made with ❤ by @Sāya#0113