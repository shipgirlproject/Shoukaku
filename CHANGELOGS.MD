### 1.2.x -> 1.3.x
> ShoukakuResolver class is now renamed to ShoukakuRest

> While ShoukakuResolver got its name changed, basic usage didn't change

> New Methods for ShoukakuRest, they are listed below
```js
ShoukakuRest.getRoutePlannerStatus(); // gets the status of your route planner nano rotation (for latest ll builds)
ShoukakuRest.unmarkFailedAddress('ip_here'); // unmarks a failed ip on your route planner (for latest ll builds)
ShoukakuRest.unmarkAllFailedAddress(); // unmarks all failed ip on your route planner (for latest ll builds)
```
### 1.1.x -> 1.2.x
> Master Compatibility change, Not compatible with commits older than `https://github.com/discordjs/discord.js/commit/5519d6fbaa61abccc27b742f97ad725bf4259265`

> Note, while I did say Master Compatibility change, it might work with older commits than what I mentioned above. But it's not my problem if it doesn't work.

> `Shoukaku#start()` is removed, hence no need to call `Shoukaku#start()` on ready event.

> `ShoukakuConstants#ShoukakuBuildOptions` is removed.

> Added `ShoukakuConstants#ShoukakuNodes`, which is an array of `ShoukakuConstants#ShoukakuNodeOptions`.

> `Shoukaku` class gained a new parameter named `nodes` which is the `ShoukakuConstants#ShoukakuNodes`. Parameters order have been changed, the example below shows the change.

Example:
```js
const servers = [{
    name: 'Lewd Server',
    host: 'localhost',
    port: 6969,
    auth: 'do not guess my password'
}];
new Shoukaku(client, servers, {
  moveOnDisconnect: false,
  resumable: 'resumableKongou',
  resumableTimeout: 30,
  reconnectTries: 2,
  restTimeout: 10000
})
```

### 1.0.x -> 1.1.x 
> `ShoukakuSocket#leaveVoiceChannel('guild_id');` is added and can be used to remove players. Although I recommend `ShoukakuPlayer#disconnect();` if you have a reference of ShoukakuPlayer.

> `ShoukakuPlayer#node` property is removed.

> Automatic Node Switching on disconnect is added, and can be enabled via `moveOnDisconnect` on `ShoukakuOptions`

> `ShoukakuPlayer#moveToNode('node_name');` is added and can be used to move players across your lavalink nodes.

### 0.2.x -> 1.0.x 
> 0.2.x and earlier `Shoukaku#build({ /* buildOptions here */ });`

> 1.0.0 and newer `Shoukaku#start({ /* buildOptions here */ });`

### 0.1.x -> 0.2.x 
> `ShoukakuLink` is now a property of `ShoukakuPlayer`, meaning all link related getters are changed to player getters.

> You can access `ShoukakuLink` via `ShoukakuPlayer#voiceConnection`

> Shoukaku's events on players are changed, and here are the events.

```js
// Events that I highly recommend YOU to handle
ShoukakuPlayer.on('end', () => {}); // Emitted when track finishes playing
ShoukakuPlayer.on('closed', () => {}); // Emitted when the voice websocket closed
ShoukakuPlayer.on('error', () => {}); // Emitted when an error happened during trying to do something
ShoukakuPlayer.on('nodeDisconnect', () => {}); // Emitted when the node disconnected and when Shoukaku can't migrate the player to another node
```
```js
// Events that I think you can leave out
ShoukakuPlayer.on('trackException', () => {}); // Emitted when Lavalink did an ooopsie. Will automatically emit end for you
ShoukakuPlayer.on('resumed', () => {}); // Emitted when the lost connection on Lavalink Node was reconnected, and the player resumed
ShoukakuPlayer.on('playerUpdate', () => {}); // Emitted when there is a player update data from Lavalink
```

> Shoukaku class have renamed methods and properties
- `Shoukaku#getLink()` -> `Shoukaku#getPlayer()`
- `Shoukaku#links` -> `Shoukaku#players`
- `Shoukaku#totalLinks` -> `Shoukaku#totalPlayers`

> ShoukakuSocket also have a renamed property
- `ShoukakuSocket#links` -> `ShoukakuSocket#players`

> Instead of player being ShoukakuLink's property, ShoukakuLink became a property of ShoukakuPlayer, making the code more concise. Example below.

```js
// 0.1.x and earlier
ShoukakuLink.player.playTrack();
ShoukakuLink.disconnect();
// 0.2.x
ShoukakuPlayer.playTrack();
ShoukakuPlayer.disconnect();
```
