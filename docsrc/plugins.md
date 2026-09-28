---
title: Plugins
---

# Plugins

Lavalink supports plugins that can add filters, REST endpoints, WebSocket events, and more. More information can be found [here](https://lavalink.dev/plugins).

# Plugins List

Open a pull request to add your plugin here

| Name     | Link                                          | Description                                              |
| -------- | --------------------------------------------- | -------------------------------------------------------- |
| Kazagumo | [Github](https://github.com/Takiyo0/Kazagumo) | A wrapper for Shoukaku that has an internal queue system |

## Creating Plugins

> [!note]
> This area is under construction.

Shoukaku has support for plugin filters, plugin REST endpoints, and plugin WebSocket events. It may be possible to support plugins that modify the Lavalink API in other ways by extending and modifying the `Rest` and `Player` classes and passing them to `options.structures` when creating a new Shoukaku instance.

> [!warning]
> Using these abstractions may introduce a performance penalty.

## Plugin Routes

Plugin routes must implement the `RestEndpoint` interface with the following properties:

- [`pluginRequired`: plugin requirement](#requiring-plugins-on-the-lavalink-server)
- `endpoint`: endpoint of route
- `method`: HTTP request method, `GET` by default
- `headers`: request headers
- `params`: URL query parameters
- `body`: JSON body, ignored when `endpoint` is `GET` or `HEAD`
- [`T`: return type of response](#the-t-field)

All properties all optional except `endpoint`.

`headers`, `params`, and `body` can be functions that return an object, which allows getting arguments from the class constructor, or a plain object.

Example with [LavaSearch (1.0.0)](https://github.com/topi314/LavaSearch) `/loadsearch` endpoint

```ts
export class LoadSearchEndpoint implements RestEndpoint {
	constructor(
		public readonly query: string,
		public readonly types: string,
	) {}

	public readonly pluginRequired = {
		name: "lavasearch-plugin",
		version: "^1.0.0",
	};

	public readonly endpoint = "/loadsearch";
	public readonly params = () => ({ query: this.query, types: this.types });

	public readonly T = t<{
		tracks?: Track[];
		albums?: Playlist[];
		artists?: Playlist[];
		playlists?: Playlist[];
		texts?: {
			text: string;
			plugin: Record<string, unknown>;
		};
		plugin: Record<string, unknown>;
	}>;
}
```

The plugin route can be passed to `<Rest>.client.fetch`.

You can also use `<Rest>.fetch` to make requests to plugin routes.

## Plugin Filters

Plugin filters must implement the `PluginFilter` interface with the following properties:

- [`pluginRequired`: plugin requirement](#requiring-plugins-on-the-lavalink-server)
- `name`: name of filter
- [`T`: type of filter object](#the-t-field)

Example with [LavaDSPX (0.0.5)](https://github.com/Devoxin/LavaDSPX-Plugin) `high-pass` filter

```ts
export class LavaDSPXHighPass implements PluginFilter {
	public readonly pluginRequired = {
		name: "lavadspx-plugin",
		version: "^0.0.5",
	};
	public readonly name = "high-pass";
	public readonly T = t<{
		cutoffFrequency: number;
		boostFactor: number;
	}>;
}
```

A plugin filter is passed to `<Player>.getPluginFilter` and `<Player>.setPluginFilter`.

You can also directly manipulate `<Player>.filters.pluginFilters` **_without_** type safety (not recommended).

## Plugin Events

Plugin events must implement the `PluginEvent` interface with the following properties:

- [`pluginRequired`: plugin requirement](#requiring-plugins-on-the-lavalink-server)
- `name`: name of event
- [`T`: type of event object](#the-t-field)

Example with [LavaLyrics (1.1.0)](https://github.com/topi314/LavaLyrics) `LyricsLineEvent` event

```ts
export class LyricsLineEvent implements PluginEvent {
	public readonly pluginRequired = {
		name: "lavalyrics-plugin",
		version: "^1.1.0",
	};

	public readonly name = "LyricsLineEvent";

	public readonly T = t<{
		lineIndex: number;
		line: {
			timestamp: number;
			duration?: number;
			line: string;
			plugin: unknown;
		};
		skipped: boolean;
	}>;
}
```

A plugin event is passed to `onPluginEvent` with a callback. Multiple callbacks for the same event is executed sequentially without a guaranteed order. It is recommended to have one callback handle multiple conditions rather than multiple callbacks that handle different conditions.

You can also directly listen to the `raw` event on `Node` and check for `op` code `event` and the value of `type` to handle plugin events. This is not recommended as data values are not typed.

## Additional Information

### The `T` field

The `T` field is a hack to work around TypeScript types not existing at runtime.

Using the provided `t` utility function for this field, you can specify a type in the type parameter, e.g. `t<string>`.

### Requiring plugins on the Lavalink server

The _optional_ `pluginRequired` property allows specifying the name of the plugin required, and the version as an npm style semver range or string. To accept any version, use `*`. More information on semver can be found [here](https://semver.npmjs.com/#syntax-examples).

When the plugin is not found, does not satisfy the version range, or does not equal the version string, a `PluginError` is thrown.
