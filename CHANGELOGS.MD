### 1.0.x -> 1.1.x Migration
> `<ShoukakuSocket>.leaveVoiceChannel('guild_id');` is added and can be used to remove players. Although I recommend `<ShoukakuPlayer>.disconnect();` if you have a reference of ShoukakuPlayer.

> `<ShoukakuPlayer>.node` property is removed.

> Automatic Node Switching on disconnect is added, and can be enabled via `moveOnDisconnect` on `ShoukakuOptions`

> `<ShoukakuPlayer>.moveToNode('node_name');` is added and can be used to move players across your lavalink nodes.

### 0.2.x -> 1.0.x 
> 0.2.x and earlier `<Shoukaku>.build({ /* buildOptions here */ });`

> 1.0.0 and newer `<Shoukaku>.start({ /* buildOptions here */ });`

### 0.1.x -> 0.2.x 
> ShoukakuLink is now a property of ShoukakuPlayer, meaning all link related getters are changed to player getters.

> You can access ShoukakuLink via .voiceConnection property of ShoukakuPlayer

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

> ShoukakuSocket also have a renamed property
- .links -> .players

> You don't disconnect / clean the player on ShoukakuLink but on ShoukakuPlayer now making your code more clean and better

> 0.1.1 and earlier
```js
<ShoukakuLink>.player.playTrack();
<ShoukakuLink>.disconnect();
```

> 0.2.x and newer
```js
<ShoukakuPlayer>.playTrack();
<ShoukakuPlayer>.disconnect();
```
