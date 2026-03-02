---
title: Plugins
---
# Plugins
Lavalink supports plugins that can add filters, REST endpoints, WebSocket events, and more. More information can be found [here](https://lavalink.dev/plugins).

# Using Plugins
> [!note]
> This area is under construction.

Shoukaku has support for plugin filters, plugin REST endpoints, and plugin WebSocket events. It may be possible to support plugins that modify the Lavalink API in other ways by extending and modifying the `Rest` and `Player` classes and passing them to `options.structures` when creating a new Shoukaku instance.

Using these abstractions may have introduce a performance penalty.

## Plugin Routes
Plugin routes must implement the `RestEndpoint` interface with the following properties:
- `pluginRequired`: plugin requirement
- `endpoint`: endpoint of route
- `method`: HTTP request method, `GET` by default
- `headers`: request headers
- `params`: URL query parameters
- `body`: JSON body, ignored when `endpoint` is `GET` or `HEAD`
- `T`: return type of response

All properties all optional except `endpoint`.

`headers`, `params`, and `body` can be functions that return an object, which allows getting arguments from the class constructor, or a plain object.

Example with [LavaSearch](https://github.com/topi314/LavaSearch) `/loadsearch` endpoint
```ts
export class LoadSearchEndpoint implements RestEndpoint {
	constructor(public readonly query: string, public readonly types: string) {}

	public readonly pluginRequired = {
		name: 'lavasearch-plugin',
		version: '^1.0.0'
	};

	public readonly endpoint = '/loadsearch';
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
- `pluginRequired`: plugin requirement
- `name`: name of filter
- `T`: type of filter object

Example with [LavaDSPX](https://github.com/Devoxin/LavaDSPX-Plugin) `high-pass` filter
```ts
	export class LavaDSPXHighPass implements PluginFilter {
		public readonly pluginRequired = {
			name: 'lavadspx-plugin',
			version: '^0.0.5'
		};
		public readonly name = 'high-pass';
		public readonly T = t<{
			cutoffFrequency: number;
			boostFactor: number;
		}>;
	}
```

A plugin filter is passed to `<Player>.getPluginFilter` and `<Player>.setPluginFilter`.

You can also directly manipulate `<Player>.filters.pluginFilters` ***without*** type safety (not recommended).

## Plugin Events
Plugin events must implement the `PluginEvent` interface with the following properties:
- `pluginRequired`: plugin requirement
- `name`: name of event
- `T`: type of event object

Example with [LavaLyrics](https://github.com/topi314/LavaLyrics) `LyricsLineEvent` event
```ts
export class LyricsLineEvent implements PluginEvent {
	public readonly pluginRequired = {
		name: 'lavalyrics-plugin',
		version: '^1.1.0'
	};

	public readonly name = 'LyricsLineEvent';

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

A plugin event is passed to `onPluginEvent` with a callback. Multiple callbacks for the same event is executed sequentially in unknown order.

You can also directly listen to the `raw` event on `Node` and check for `op` code `event` and the value of `type` to handle plugin events.

## Additional Information

### The `T` field
The `T` field is a hack to work around TypeScript types not existing at runtime. 

Using the provided `t` utility function for this field, you can specify a type in the type parameter, e.g. `t<string>`.

### Requiring plugins on the Lavalink server
The `pluginRequired` property allows specifying the name of the plugin required, and the version as an npm style semver range. To accept any version, use `*`. More information can be found [here](https://semver.npmjs.com/#syntax-examples).

When the plugin is not found or does not satisfy the version range, a `PluginError` is thrown.
