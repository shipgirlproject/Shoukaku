## Shoukaku

> A featureful lavalink wrapper for Lavalink

<center>

[![Discord](https://img.shields.io/discord/423116740810244097?style=flat-square)](https://discordapp.com/invite/FVqbtGu)
[![npm](https://img.shields.io/npm/v/shoukaku?style=flat-square)](https://www.npmjs.com/package/shoukaku)
![Github Stars](https://img.shields.io/github/stars/Deivu/Shoukaku?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues-raw/Deivu/Shoukaku?style=flat-square)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/shoukaku?style=flat-square) 
![NPM](https://img.shields.io/npm/l/shoukaku?style=flat-square)
<img width="497" height="768" alt="Shoukaku" src="https://raw.githubusercontent.com/Deivu/Shoukaku/master/assets/cover.png"></img>

</center>

> The ShipGirl Project, feat Shoukaku; ⓒ Kancolle

### Features

✅ Straightforward

✅ Stable

✅ Feature-rich

✅ Very cute shipgirl ❤ (Very Important)

### Supported Libraries

Refer to [/src/libraries](https://github.com/Deivu/Shoukaku/tree/next/src/libraries) for list of supported libraries + how to support other libraries

### Installation

```
npm install git://github.com/Deivu/Shoukaku.git#next --save
```

### Documentation 

> Clone this repo, then install dev-dependencies, then run `docma serve`

### Getting Lavalink

Download binaries from the [CI server](https://ci.fredboat.com/viewLog.html?buildId=lastSuccessful&buildTypeId=Lavalink_Build&tab=artifacts&guest=1) or the [GitHub](https://github.com/freyacodes/Lavalink/releases) releases.

Put an [application.yml](https://github.com/freyacodes/Lavalink/blob/master/LavalinkServer/application.yml.example) file in your working directory.

Run with `java -jar Lavalink.jar`

Docker images are available on the [Docker](https://hub.docker.com/r/fredboat/lavalink/) hub.

### Other Links

[Support](https://discord.gg/FVqbtGu) (#Development) | [Lavalink](https://github.com/freyacodes/Lavalink)

### Example (Discord.JS)

> Bot Implementation: https://github.com/Deivu/Kongou

> Basic Implementation:

```js
const { Client } = require('discord.js');
const { Shoukaku, Libraries } = require('shoukaku');

const LavalinkServer = [{ name: 'Localhost', url: 'localhost:6969', auth: 'big_weeb' }];
const ShoukakuOptions = { moveOnDisconnect: false, resumable: false, resumableTimeout: 30, reconnectTries: 2, restTimeout: 10000 };

class ExampleBot extends Client {
    constructor(opts) {
        super(opts);
        this.shoukaku = new Shoukaku(new Libraries.DiscordJS(client), LavalinkServer, ShoukakuOptions);
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
        this.on('messageCreate', async (msg) => {
            if (msg.author.bot || !msg.guild) return;
            if (!msg.content.startsWith('$play')) return;
            if (this.shoukaku.players.get(msg.guild.id)) return;
            const args = msg.content.split(' ');
            if (!args[1]) return;
            const node = this.shoukaku.getNode();
            let data = await node.rest.resolve(args[1]);
            if (!data) return;
            const player = await node.joinChannel({
                guildId: msg.guild.id,
                shardId: msg.guild.shardId,
                channelId: msg.member.voice.channelId
            });
            const events = ['end', 'error', 'closed'];
            for (const event of events) {
                player.on(event, info => {
                    console.log(info);
                    player.disconnect();
                });
            }
            data = data.tracks.shift();
            player.playTrack(data); 
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
