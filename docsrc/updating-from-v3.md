---
title: Updating from v3 to v4
---
# Updating from v3 to v4
There are breaking changes in Shoukaku v4. Here are some modifications that need to be made to your code.

## Common usage
### Getting a node
As node resolving is configurable in v4, the method to do so has changed.
```diff
- const node = shoukaku.getNode();
+ const node = shoukaku.options.nodeResolver(shoukaku.nodes);
```

### Joining voice channels
You now join voice channels using the main Shoukaku class, and not on the Node class
```diff
-const player = await node.joinChannel({
+const player = await shoukaku.joinVoiceChannel({
    guildId: "your_guild_id",
    channelId: "your_channel_id",
    shardId: 0, // if unsharded it will always be zero (depending on your library implementation)
});
```

### Resolving tracks
You can also use the player.node property after connecting to a voice channel to resolve tracks, but the old method would still work.
```diff
-const result = await node.rest.resolve("scsearch:snowhalation");
+const result = await player.node.rest.resolve("scsearch:snowhalation");
```

### Playing tracks
Play the track using the encoded metadata.
```diff
-player.playTrack({ track: metadata.track })
+await player.playTrack({ track: { encoded: metadata.encoded } });
```

### Leaving voice channels
Similar to joining voice channels, it is also on the main Shoukaku class.
```diff
-player.connection.disconnect();
+await shoukaku.leaveVoiceChannel(player.guildId);
```

## Other changes

### Player methods
Player methods now return promises.
```ts
await player.playTrack(...data);
await player.stopTrack();
```

### Volume
There are 2 kinds of volumes you can set, global and filter.

The global volume accepts 0-1000 as it's values
```ts
await player.setGlobalVolume(100);
```
To check the current global volume
```ts
console.log(player.volume);
```
The filter volume accepts 0.0-5.0 as it's values
```ts
await player.setFilterVolume(1.0);
```
To check the current filter volume (filters.volume can be undefined)
```ts
console.log(player.filters.volume);
```

### Internal changes

New variable in shoukaku class, which handles the "connection data" of discord only
```ts
console.log(shoukaku.connections);
```

Players are moved from `node.players` to `shoukaku.players`
```ts
console.log(shoukaku.players);
```

You can supply a custom node resolver for your own way of getting an ideal node by supplying the nodeResolver option in Shoukaku options
```ts
const ShoukakuOptions = {
    ...yourShoukakuOptions,
    nodeResolver: (nodes, connection) => getYourIdealNode(nodes, connection),
};
```
