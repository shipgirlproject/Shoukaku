---
title: Common Usage
---
# Common Usage
## Join a voice channel, search for a track, play the track, then disconnect after 30 seconds

1. Tell Lavalink to join a Discord voice channel.
```ts
const player = await shoukaku.joinVoiceChannel({
    guildId: "your_guild_id",
    channelId: "your_channel_id",
    shardId: 0, // if unsharded it will always be zero (depending on your library implementation)
});
```
2. Determine which Node to use.
```ts
const node = shoukaku.options.nodeResolver(shoukaku.nodes);
```
3. Search for a track, here we are searching via [SoundCloud](https://soundcloud.com), using the `scsearch:` prefix. The string after the prefix is the search query.
```ts
const result = await node.rest.resolve("scsearch:snowhalation");
if (!result?.tracks.length) return;
const metadata = result.tracks.shift();
```
4. Tell Lavalink to play the searched track.
```ts
await player.playTrack({ track: { encoded: metadata.encoded } });
```
5. After 30 seconds, tell Lavalink to leave the voice channel.
```ts
setTimeout(() => shoukaku.leaveVoiceChannel(player.guildId), 30000).unref();
```

## Playing a track and changing a playback option
Here we are changing the volume, you can do [other stuff](/api/classes/player#methods) as well.
```ts
await player.playTrack({ track: { encoded: metadata.encoded } });
await player.setGlobalVolume(50);
```

You can also update the player without using helper functions
```ts
await player.update({ ...playerOptions });
```

## Custom function to get the ideal node
When executing any action, an API endpoint is called on a Lavalink node. When there are many nodes passed in the configuration, some logic is used to select the node to perform actions on.
```ts
const shoukaku = new Shoukaku(
    new Connectors.DiscordJS(client),
    [{ ...yourNodeOptions }],
    {
      ...yourShoukakuOptions,
      nodeResolver: (nodes, connection) => getYourIdealNode(nodes, connection),
    }
);

const player = await shoukaku.joinVoiceChannel({
    guildId: "your_guild_id",
    channelId: "your_channel_id",
    shardId: 0,
});
```
