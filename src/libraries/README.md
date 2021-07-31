## Shoukaku's Supported Libraries

* [Discord.JS](https://discord.js.org/#/) (v13.0.0-dev)

* Implement your own 

## Implementing your own

* Refer to `DiscordJS.js` for my original implementation of the library plugins

* Then require the js file on `Libraries.JS`

* Then call it by calling `Libraries` on your Shoukaku require

Example
```js
const { Shoukaku, Libraries } = require('shoukaku');
new Shoukaku(new Libraries.NameOfYourRequiredFileOnLibrariesJS(client), servers, options);
// example if you made it for eris, then you required it on Libraries.JS with it's key being Eris
new Shoukaku(new Libraries.Eris(client), servers, options);
// where in the client is your eris client
```

* And Submit a PR so other people don't need to do it themselves, yay!

> This enables Shoukaku to be used on another library without the hassle of doing so

## Support

For questions on how to do so, just ask at my support server at [HERE](https://discord.gg/FVqbtGu) (#Development)