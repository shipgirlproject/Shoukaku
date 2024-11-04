import * as z from 'zod';
// eslint-disable-next-line import-x/no-cycle
import { Versions } from '../Constants';
// eslint-disable-next-line import-x/no-cycle
import { FilterOptions, PlayerState } from '../guild/Player';
import { NodeOption } from '../Shoukaku';
// eslint-disable-next-line import-x/no-cycle
import { Node, NodeInfo, Stats } from './Node';

/**
 * Severity of a Lavalink exception
 * @see https://lavalink.dev/api/websocket.html#severity
 */
export enum SeverityEnum {
	/**
	 * Cause is known and expected, indicates that there is nothing wrong with Lavalink
	 */
	COMMON = 'common',
	/**
	 * Cause might not be exactly known, but is possibly caused by outside factors, 
	 * for example when an outside service responds in a format Lavalink did not expect
	 */
	SUSPICIOUS = 'suspicious',
	/**
	 * Probable cause is an issue with Lavalink or there is no way to tell what the cause might be, 
	 * this is the default level and other levels are used in cases where the thrower has more in-depth knowledge about the error
	 */
	FAULT = 'fault'
}

export const Severity = z.nativeEnum(SeverityEnum);
export type Severity = z.TypeOf<typeof Severity>;

/**
 * Type of resource loaded / status code
 * @see https://lavalink.dev/api/rest.html#load-result-type
 */
enum LoadTypeEnum {
	/**
	 * A track has been loaded
	 */
	TRACK = 'track',
	/**
	 * A playlist has been loaded
	 */
	PLAYLIST = 'playlist',
	/**
	 * A search result has been loaded
	 */
	SEARCH = 'search',
	/**
	 * There has been no matches for your identifier
	 */
	EMPTY = 'empty',
	/**
	 * Loading has failed with an error
	 */
	ERROR = 'error'
}

export const LoadType = z.nativeEnum(LoadTypeEnum);
export type LoadType = z.TypeOf<typeof LoadType>;

/**
 * Represents a Lavalink track
 * @see https://lavalink.dev/api/rest.html#track
 */
export const Track = z.object({
	/**
	 * Base64 encoded track data
	 */
	encoded: z.string(),
	/**
	 * Track information
	 * @see https://lavalink.dev/api/rest.html#track-info
	 */
	info: z.object({
		/**
		 * Track identifier
		 */
		identifier: z.string(),
		/**
		 * Whether the track is seekable
		 */
		isSeekable: z.boolean(),
		/**
		 * Track author
		 */
		author: z.string(),
		/**
		 * Track length in milliseconds
		 */
		length: z.number().int().min(0),
		/**
		 * Whether the track is a livestream
		 */
		isStream: z.boolean(),
		/**
		 * Current playback time in milliseconds
		 */
		position: z.number().int().min(0),
		/**
		 * Track title
		 */
		title: z.string(),
		/**
		 * Track URI
		 */
		uri: z.string().optional(),
		/**
		 * Track artwork url
		 */
		artworkUrl: z.string().optional(),
		/**
		 * Track ISRC
		 * @see https://en.wikipedia.org/wiki/International_Standard_Recording_Code
		 */
		isrc: z.string().optional(),
		/**
		 * The source this track was resolved from
		 */
		sourceName: z.string()
	}),
	/**
	 * Additional track info provided by plugins
	 */
	pluginInfo: z.record(z.unknown()),
	/**
	 * Additional track data provided via the Update Player endpoint
	 * @see https://lavalink.dev/api/rest#update-player
	 */
	userData: z.record(z.unknown())
});

export type Track = z.TypeOf<typeof Track>;

/**
 * Represents a Lavalink playlist
 * @see https://lavalink.dev/api/rest.html#playlist-result-data
 */
export const Playlist = z.object({
	/**
	 * Base64 encoded playlist data
	 */
	encoded: z.string(),
	/**
	 * Playlist information
	 * @see https://lavalink.dev/api/rest.html#playlist-info
	 */
	info: z.object({
		/**
		 * Name of the playlist
		 */
		name: z.string(),
		/**
		 * The selected track of the playlist (-1 if no track is selected)
		 */
		selectedTrack: z.number().int().min(-1)
	}),
	/**
	 * Additional track info provided by plugins
	 */
	pluginInfo: z.unknown(),
	/**
	 * Tracks in the playlist
	 * @see {@link Track} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#track
	 */
	tracks: z.array(Track)
});

export type Playlist = z.TypeOf<typeof Playlist>;

/**
 * Represents a Lavalink exception (error)
 */
export const Exception = z.object({
	/**
	 * Message of the exception
	 */
	message: z.string(),
	/**
	 * Severity of the exception
	 * @see {@link Severity} representation in Shoukaku
	 * @see https://lavalink.dev/api/websocket.html#severity
	 */
	severity: Severity,
	/**
	 * Cause of the exception
	 */
	cause: z.string()
});

export type Exception = z.TypeOf<typeof Exception>;

/**
 * Track loading result when a track has been resolved
 * @see https://lavalink.dev/api/rest.html#track-loading-result
 */
export const TrackResult = z.object({
	/**
	 * Type of the result
	 * @see {@link LoadType} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#load-result-type
	 */
	loadType: z.literal(LoadType.enum.TRACK),
	/**
	 * Track object with loaded track
	 * @see {@link Track} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#load-result-data
	 */
	data: Track
});

export type TrackResult = z.TypeOf<typeof TrackResult>;

/**
 * Track loading result when a playlist has been resolved
 * @see https://lavalink.dev/api/rest.html#track-loading-result
 */
export const PlaylistResult = z.object({
	/**
	 * Type of the result
	 * @see {@link LoadType} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#load-result-type
	 */
	loadType: z.literal(LoadType.enum.PLAYLIST),
	/**
	 * Playlist object with loaded playlist
	 * @see {@link Playlist} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#playlist-result-data
	 */
	data: Playlist
});

export type PlaylistResult = z.TypeOf<typeof PlaylistResult>;

/**
 * Track loading result when a search query has been resolved
 * @see https://lavalink.dev/api/rest.html#track-loading-result
 */
export const SearchResult = z.object({
	/**
	 * Type of the result
	 * @see {@link LoadType} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#load-result-type
	 */
	loadType: z.literal(LoadType.enum.SEARCH),
	/**
	 * Array of Track objects from the search result
	 * @see {@link Track} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#search-result-data
	 */
	data: z.array(Track)
});

export type SearchResult = z.TypeOf<typeof SearchResult>;

/**
 * Track loading result when there is no result
 * @see https://lavalink.dev/api/rest.html#track-loading-result
 */
export const EmptyResult = z.object({
	/**
	 * Type of the result
	 * @see {@link LoadType} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#load-result-type
	 */
	loadType: z.literal(LoadType.enum.EMPTY),
	/**
	 * An empty object
	 * @see https://lavalink.dev/api/rest.html#search-result-data
	 */
	data: z.record(z.never())
});

export type EmptyResult = z.TypeOf<typeof EmptyResult>;

/**
 * Track loading result when an error has occured
 * @see https://lavalink.dev/api/rest.html#track-loading-result
 */
export const ErrorResult = z.object({
	/**
	 * Type of the result
	 * @see {@link LoadType} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#load-result-type
	 */
	loadType: z.literal(LoadType.enum.ERROR),
	/**
	 * Exception object with the error
	 * @see {@link Exception} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#error-result-data
	 */
	data: Exception
});

export type ErrorResult = z.TypeOf<typeof ErrorResult>;

/**
 * All possible responses on the track loading endpoint
 * @see {@link TrackResult} - when track is loaded
 * @see {@link PlaylistResult} - when playlist is loaded
 * @see {@link SearchResult} - when search query is resolved
 * @see {@link EmptyResult} - when nothing is loaded
 * @see {@link ErrorResult} - when error occurs during load
 * @see https://lavalink.dev/api/rest.html#track-loading-result
 */
export const LavalinkResponse = z.discriminatedUnion('loadType', [
	TrackResult,
	PlaylistResult,
	SearchResult,
	EmptyResult,
	ErrorResult
]);

export type LavalinkResponse = z.TypeOf<typeof LavalinkResponse>;

/**
 * Type of route planner
 * @see https://lavalink.dev/api/rest.html#route-planner-types
 */
enum RoutePlannerTypeEnum {
	/**
	 * IP address used is switched on ban. Recommended for IPv4 blocks or IPv6 blocks smaller than a /64.
	 */
	ROTATING_IP_ROUTE_PLANNER = 'RotatingIpRoutePlanner',
	/**
	 * IP address used is switched on clock update. Use with at least 1 /64 IPv6 block.
	 */
	NANO_IP_ROUTE_PLANNER = 'NanoIpRoutePlanner',
	/**
	 * IP address used is switched on clock update, rotates to a different /64 block on ban. Use with at least 2x /64 IPv6 blocks.
	 */
	ROTATING_NANO_IP_ROUTE_PLANNER = 'RotatingNanoIpRoutePlanner',
	/**
	 * IP address used is selected at random per request. Recommended for larger IP blocks.
	 */
	BALANCING_IP_ROUTE_PLANNER = 'BalancingIpRoutePlanner'
}

export const RoutePlannerType = z.nativeEnum(RoutePlannerTypeEnum);
export type RoutePlannerType = z.TypeOf<typeof RoutePlannerType>;

/**
 * Type of IP block
 * @see https://lavalink.dev/api/rest#ip-block-type
 */
enum IpBlockTypeEnum {
	/**
	 * IPv4 block
	 * @see https://en.wikipedia.org/wiki/IPv4
	 */
	IPV4 = 'Inet4Address',
	/**
	 * IPv6 block
	 * @see https://en.wikipedia.org/wiki/IPv6
	 */
	IPV6 = 'Inet6Address'
}

export const IpBlockType = z.nativeEnum(IpBlockTypeEnum);
export type IpBlockType = z.TypeOf<typeof IpBlockType>;

/**
 * IP block
 * @see https://lavalink.dev/api/rest#ip-block-object
 */
export const IpBlock = z.object({
	/**
	 * Type of IP block
	 * @see {@link IpBlockType} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest#ip-block-type
	 */
	type: IpBlockType,
	/**
	 * Size of IP block (number of IPs)
	 */
	size: z.string()
});

export type IpBlock = z.TypeOf<typeof IpBlock>;

/**
 * Describes a failing IP Address
 * @see https://lavalink.dev/api/rest#failing-address-object
 */
export const FailingAddress = z.object({
	/**
	 * The failing IP address
	 */
	failingAddress: z.string(),
	/**
	 * UNIX timestamp when the IP address failed
	 */
	failingTimestamp: z.number().int().min(0),
	/**
	 * Time when the IP address failed as a pretty string
	 * @see https://docs.oracle.com/javase/8/docs/api/java/util/Date.html#toString--
	 */
	failingTime: z.string()
});

export type FailingAddress = z.TypeOf<typeof FailingAddress>;

/**
 * Route planner response when using RotatingIpRoutePlanner
 * @see https://lavalink.dev/api/rest.html#routeplanner-api
 */
export const RotatingIpRoutePlanner = z.object({
	/**
	 * Type of route planner
	 * @see {@link RoutePlannerType} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#route-planner-types
	 */
	class: z.literal(RoutePlannerType.enum.ROTATING_IP_ROUTE_PLANNER),
	/**
	 * Information about the route planner
	 * @see https://lavalink.dev/api/rest.html#details-object
	 */
	details: z.object({
		/**
		 * IP block being used
		 * @see {@link IpBlock} representation in Shoukaku
		 * @see https://lavalink.dev/api/rest#ip-block-object
		 */
		ipBlock: IpBlock,
		/**
		 * Array of failing IP addresses
		 * @see {@link FailingAddress} representation in Shoukaku
		 * @see https://lavalink.dev/api/rest#failing-address-object
		 */
		failingAddresses: z.array(FailingAddress),
		/**
		 * Number of IP rotations
		 */
		rotateIndex: z.string(),
		/**
		 * Current offset in the block
		 */
		ipIndex: z.string(),
		/**
		 * Current IP address being used
		 */
		currentAddress: z.string()
	})
});

export type RotatingIpRoutePlanner = z.TypeOf<typeof RotatingIpRoutePlanner>;

/**
 * Route planner response when using NanoIpRoutePlanner
 * @see https://lavalink.dev/api/rest.html#routeplanner-api
 */
export const NanoIpRoutePlanner = z.object({
	/**
	 * Type of route planner
	 * @see {@link RoutePlannerType} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#route-planner-types
	 */
	class: z.literal(RoutePlannerType.enum.NANO_IP_ROUTE_PLANNER),
	/**
	 * Information about the route planner
	 * @see https://lavalink.dev/api/rest.html#details-object
	 */
	details: z.object({
		/**
		 * IP block being used
		 * @see {@link IpBlock} representation in Shoukaku
		 * @see https://lavalink.dev/api/rest#ip-block-object
		 */
		ipBlock: IpBlock,
		/**
		 * Array of failing IP addresses
		 * @see {@link FailingAddress} representation in Shoukaku
		 * @see https://lavalink.dev/api/rest#failing-address-object
		 */
		failingAddresses: z.array(FailingAddress),
		/**
		 * Current offset in the IP block
		 */
		currentAddressIndex: z.string()
	})
});

export type NanoIpRoutePlanner = z.TypeOf<typeof NanoIpRoutePlanner>;

/**
 * Route planner response when using RotatingNanoIpRoutePlanner
 * @see https://lavalink.dev/api/rest.html#routeplanner-api
 */
export const RotatingNanoIpRoutePlanner = z.object({
	/**
	 * Type of route planner
	 * @see {@link RoutePlannerType} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#route-planner-types
	 */
	class: z.literal(RoutePlannerType.enum.ROTATING_NANO_IP_ROUTE_PLANNER),
	/**
	 * Information about the route planner
	 * @see https://lavalink.dev/api/rest.html#details-object
	 */
	details: z.object({
		/**
		 * IP block being used
		 * @see {@link IpBlock} representation in Shoukaku
		 * @see https://lavalink.dev/api/rest#ip-block-object
		 */
		ipBlock: IpBlock,
		/**
		 * Array of failing IP addresses
		 * @see {@link FailingAddress} representation in Shoukaku
		 * @see https://lavalink.dev/api/rest#failing-address-object
		 */
		failingAddresses: z.array(FailingAddress),
		/**
		 * Current offset in the IP block
		 */
		currentAddressIndex: z.string(),
		/**
		 * The information in which /64 block IPs are chosen, 
		 * this number increases on each ban
		 */
		blockIndex: z.string()
	})
});

export type RotatingNanoIpRoutePlanner = z.TypeOf<typeof RotatingNanoIpRoutePlanner>;

/**
 * Route planner response when using BalancingIpRoutePlanner
 * @see https://lavalink.dev/api/rest.html#routeplanner-api
 */
export const BalancingIpRoutePlanner = z.object({
	/**
	 * Type of route planner
	 * @see {@link RoutePlannerType} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#route-planner-types
	 */
	class: z.literal(RoutePlannerType.enum.BALANCING_IP_ROUTE_PLANNER),
	/**
	 * Information about the route planner
	 * @see https://lavalink.dev/api/rest.html#details-object
	 */
	details: z.object({
		/**
		 * IP block being used
		 * @see {@link IpBlock} representation in Shoukaku
		 * @see https://lavalink.dev/api/rest#ip-block-object
		 */
		ipBlock: IpBlock,
		/**
		 * Array of failing IP addresses
		 * @see {@link FailingAddress} representation in Shoukaku
		 * @see https://lavalink.dev/api/rest#failing-address-object
		 */
		failingAddresses: z.array(FailingAddress)
	})
});

export type BalancingIpRoutePlanner = z.TypeOf<typeof BalancingIpRoutePlanner>;

export const NullRoutePlanner = z.object({
	/**
	 * Type of route planner
	 * @see {@link RoutePlannerType} representation in Shoukaku
	 * @see https://lavalink.dev/api/rest.html#route-planner-types
	 */
	class: z.null(),
	/**
	 * Information about the route planner
	 * @see https://lavalink.dev/api/rest.html#details-object
	 */
	details: z.null()
});

export type NullRoutePlanner = z.TypeOf<typeof NullRoutePlanner>;

/**
 * RoutePlanner status
 * @see https://lavalink.dev/api/rest.html#routeplanner-api
 */
export const RoutePlanner = z.discriminatedUnion('class', [
	RotatingIpRoutePlanner,
	NanoIpRoutePlanner,
	RotatingNanoIpRoutePlanner,
	BalancingIpRoutePlanner,
	NullRoutePlanner
]);

export type RoutePlanner = z.TypeOf<typeof RoutePlanner>;

/**
 * Player voice state
 * @see https://lavalink.dev/api/rest#voice-state
 */
export const LavalinkPlayerVoice = z.object({
	/**
	 * Discord voice token
	 */
	token: z.string(),
	/**
	 * Discord voice server endpoint
	 */
	endpoint: z.string(),
	/**
	 * Discord voice session id
	 */
	sessionId: z.string(),
	/**
	 * Discord voice server connection status
	 */
	connected: z.boolean().optional(),
	/**
	 * Discord voice server connection latency
	 */
	ping: z.number().int().optional()
});

export type LavalinkPlayerVoice = z.TypeOf<typeof LavalinkPlayerVoice>;

/**
 * Player voice connection options
 * @see https://lavalink.dev/api/rest.html#voice-state
 */
export const LavalinkPlayerVoiceOptions = LavalinkPlayerVoice.omit({ connected: true, ping: true });

export type LavalinkPlayerVoiceOptions = z.TypeOf<typeof LavalinkPlayerVoiceOptions>;

/**
 * Represents a Lavalink player
 * @see https://lavalink.dev/api/rest.html#player
 */
export const LavalinkPlayer = z.object({
	/**
	 * Guild id of the player
	 */
	guildId: z.string(),
	/**
	 * Currently playing track
	 * @see {@link Track} representation in Shoukaku
	 */
	track: z.optional(Track),
	/**
	 * Volume of the player, range 0-1000, in percentage
	 */
	volume: z.number().int().min(0).max(1000),
	/**
	 * Whether the player is paused
	 */
	paused: z.boolean(),
	/**
	 * State of the player
	 */
	state: PlayerState,
	/**
	 * Voice state of the player
	 */
	voice: LavalinkPlayerVoice,
	/**
	 * Filters used by the player
	 */
	filters: FilterOptions
});

export type LavalinkPlayer = z.TypeOf<typeof LavalinkPlayer>;

export const EncodedUpdatePlayerTrackOptions = z.object({
	/**
	 * Base64 encoded track to play. null stops the current track
	 */
	encoded: z.string().nullable(),
	identifier: z.undefined(),
	/**
	 * Additional track data to be sent back in the track object
	 * @see https://lavalink.dev/api/rest#track
	 */
	userData: z.unknown().optional()
});

export type EncodedUpdatePlayerTrackOptions = z.TypeOf<typeof EncodedUpdatePlayerTrackOptions>;

export const IdentifierUpdatePlayerTrackOptions = z.object({
	encoded: z.undefined(),
	/**
	 * Identifier of the track to play
	 */
	identifier: z.string(),
	/**
	 * Additional track data to be sent back in the track object
	 * @see https://lavalink.dev/api/rest#track
	 */
	userData: z.unknown().optional()
});

export type IdentifierUpdatePlayerTrackOptions = z.TypeOf<typeof IdentifierUpdatePlayerTrackOptions>;

/**
 * Options for updating/creating the player's track
 * @see https://lavalink.dev/api/rest.html#update-player-track
 */
export const UpdatePlayerTrackOptions = z.union([
	EncodedUpdatePlayerTrackOptions,
	IdentifierUpdatePlayerTrackOptions
]);

export type UpdatePlayerTrackOptions = z.TypeOf<typeof UpdatePlayerTrackOptions>;

/**
 * Options for updating/creating the player
 * @see https://lavalink.dev/api/rest.html#update-player
 */
export const UpdatePlayerOptions = z.object({
	/**
	 * Specification for a new track to load, as well as user data to set
	 * @see {@link UpdatePlayerTrackOptions} representation in Shoukaku
	 */
	track: z.optional(UpdatePlayerTrackOptions),
	/**
	 * Track position in milliseconds
	 */
	position: z.number().int().min(0).optional(),
	/**
	 * The track end time in milliseconds (must be > 0). null resets this if it was set previously
	 */
	endTime: z.number().int().min(0).nullable().optional(),
	/**
	 * The player volume, in percentage, from 0 to 1000
	 */
	volume: z.number().int().min(0).max(1000).optional(),
	/**
	 * Whether the player is paused
	 */
	paused: z.boolean().optional(),
	/**
	 * The new filters to apply, this will override all previously applied filters
	 * @see {@link FilterOptions} representation in Shoukaku
	 */
	filters: z.optional(FilterOptions),
	/**
	 * Information required for connecting to Discord
	 */
	voice: z.optional(LavalinkPlayerVoiceOptions)
});

export type UpdatePlayerOptions = z.TypeOf<typeof UpdatePlayerOptions>;

/**
 * Options for updating/creating the player for a guild
 */
export const UpdatePlayerInfo = z.object({
	/**
	 * Discord guild ID
	 */
	guildId: z.string(),
	/**
	 * Options for updating/creating the player
	 * @see {@link UpdatePlayerOptions} representation in Shoukaku
	 */
	playerOptions: UpdatePlayerOptions,
	/**
	 * Whether to replace the current track with the new track, defaults to false
	 */
	noReplace: z.boolean().optional()
});

export type UpdatePlayerInfo = z.TypeOf<typeof UpdatePlayerInfo>;

/**
 * Session information
 * @see https://lavalink.dev/api/rest.html#update-session
 */
export const SessionInfo = z.object({
	// TODO: figure out why this is here, doesnt exist in LL docs
	/**
	 * Resuming key
	 */
	resumingKey: z.string().optional(),
	/**
	 * Whether resuming is enabled for this session or not
	 */
	resuming: z.boolean(),
	/**
	 * The timeout in seconds (default is 60s)
	 */
	timeout: z.number().int().min(0)
});

export type SessionInfo = z.TypeOf<typeof SessionInfo>;

interface FetchOptions {
	endpoint: string;
	options: {
		headers?: Record<string, string>;
		params?: Record<string, string>;
		method?: string;
		body?: Record<string, unknown>;
		[key: string]: unknown;
	};
}

interface FinalFetchOptions {
	method: string;
	headers: Record<string, string>;
	signal: AbortSignal;
	body?: string;
}

/**
 * Wrapper around Lavalink REST API
 */
export class Rest {
	/**
	 * Node that initialized this instance
	 * 
	 * @see {@link Node}
	 */
	protected readonly node: Node;

	/**
	 * URL of Lavalink
	 */
	protected readonly url: string;

	/**
	 * Credentials to access Lavalink
	 */
	protected readonly auth: string;

	/**
	 * Whether to validate Lavalink responses
	 */
	private readonly validate: boolean;

	/**
	 * @param node An instance of Node
	 * @param options The options to initialize this rest class
	 * @param options.name Name of this node
	 * @param options.url URL of Lavalink
	 * @param options.auth Credentials to access Lavalnk
	 * @param options.secure Weather to use secure protocols or not
	 * @param options.group Group of this node
	 */
	constructor(node: Node, options: NodeOption) {
		this.node = node;
		this.url = `${options.secure ? 'https' : 'http'}://${options.url}/v${Versions.REST_VERSION}`;
		this.auth = options.auth;
		this.validate = this.node.manager.options.validate;
	}

	protected get sessionId(): string {
		return this.node.sessionId!;
	}

	/**
	 * Resolve a track
	 * @param identifier Track ID
	 * @returns A promise that resolves to a {@link LavalinkResponse}
	 */
	public async resolve(identifier: string): Promise<LavalinkResponse | undefined> {
		const options = {
			endpoint: '/loadtracks',
			options: { params: { identifier }}
		};
		const response = await this.fetch<LavalinkResponse>(options);
		if (!this.validate) return response;
		return LavalinkResponse.parse(response);
	}

	/**
	 * Decode a track
	 * @param track Encoded track
	 * @returns Promise that resolves to a {@link Track}
	 */
	public async decode(track: string): Promise<Track | undefined> {
		const options = {
			endpoint: '/decodetrack',
			options: { params: { track }}
		};
		const response = await this.fetch<Track>(options);
		if (!this.validate) return response;
		return Track.parse(response);
	}

	/**
	 * Gets all the player with the specified sessionId
	 * @returns Promise that resolves to an array of {@link LavalinkPlayer | LavalinkPlayer} objects
	 */
	public async getPlayers(): Promise<LavalinkPlayer[]> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/players`,
			options: {}
		};
		const response = await this.fetch<LavalinkPlayer[]>(options) ?? [];
		if (!this.validate) return response;
		return LavalinkPlayer.array().parse(response);
	}

	/**
	 * Gets the player with the specified guildId
	 * @returns Promise that resolves to a {@link LavalinkPlayer}
	 */
	public async getPlayer(guildId: string): Promise<LavalinkPlayer | undefined> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/players/${guildId}`,
			options: {}
		};
		const response = await this.fetch<LavalinkPlayer>(options);
		if (!this.validate) return response;
		return LavalinkPlayer.parse(response);
	}

	/**
	 * Updates a Lavalink player
	 * @param data SessionId from Discord
	 * @returns Promise that resolves to a {@link LavalinkPlayer}
	 */
	public async updatePlayer(data: UpdatePlayerInfo): Promise<LavalinkPlayer | undefined> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/players/${data.guildId}`,
			options: {
				method: 'PATCH',
				params: { noReplace: data.noReplace?.toString() ?? 'false' },
				headers: { 'Content-Type': 'application/json' },
				body: data.playerOptions as Record<string, unknown>
			}
		};
		const response = await this.fetch<LavalinkPlayer>(options);
		if (!this.validate) return response;
		return LavalinkPlayer.parse(response);
	}

	/**
	 * Deletes a Lavalink player
	 * @param guildId guildId where this player is
	 */
	public async destroyPlayer(guildId: string): Promise<void> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/players/${guildId}`,
			options: { method: 'DELETE' }
		};
		return await this.fetch<void>(options);
	}

	/**
	 * Updates the session with a resume boolean and timeout
	 * @param resuming Whether resuming is enabled for this session or not
	 * @param timeout Timeout to wait for resuming
	 * @returns Promise that resolves to {@link SessionInfo}
	 */
	public async updateSession(resuming?: boolean, timeout?: number): Promise<SessionInfo | undefined> {
		const options = {
			endpoint: `/sessions/${this.sessionId}`,
			options: {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: { resuming, timeout }
			}
		};
		const response = await this.fetch<SessionInfo>(options);
		if (!this.validate) return response;
		return SessionInfo.parse(response);
	}

	/**
	 * Gets the status of this node
	 * @returns Promise that resolves to a {@link Stats} object
	 */
	public async stats(): Promise<Stats | undefined> {
		const options = {
			endpoint: '/stats',
			options: {}
		};
		const response = await this.fetch<Stats>(options);
		if (!this.validate) return response;
		return Stats.parse(response);
	}

	/**
	 * Get routeplanner status from Lavalink
	 * @returns Promise that resolves to a {@link RoutePlanner} response
	 */
	public async getRoutePlannerStatus(): Promise<RoutePlanner | undefined> {
		const options = {
			endpoint: '/routeplanner/status',
			options: {}
		};
		const response = await this.fetch<RoutePlanner>(options);
		if (!this.validate) return response;
		return RoutePlanner.parse(response);
	}

	/**
	 * Release blacklisted IP address into pool of IPs
	 * @param address IP address
	 * @returns Promise that resolves to void
	 */
	public async unmarkFailedAddress(address: string): Promise<void> {
		const options = {
			endpoint: '/routeplanner/free/address',
			options: {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: { address }
			}
		};
		return await this.fetch<void>(options);
	}

	/**
	 * Get Lavalink info
	 * @returns Promise that resolves to {@link NodeInfo}
	 */
	public async getLavalinkInfo(): Promise<NodeInfo | undefined> {
		const options = {
			endpoint: '/info',
			options: {
				headers: { 'Content-Type': 'application/json' }
			}
		};
		const response = await this.fetch<NodeInfo>(options);
		if (!this.validate) return response;
		return NodeInfo.parse(response);
	}

	/**
	 * Make a request to Lavalink
	 * @param fetchOptions.endpoint Lavalink endpoint
	 * @param fetchOptions.options Options passed to fetch
	 * @throws {@link RestError} when encountering a Lavalink error response
	 * @internal
	 */
	protected async fetch<T = unknown>(fetchOptions: FetchOptions) {
		const { endpoint, options } = fetchOptions;
		let headers = {
			'Authorization': this.auth,
			'User-Agent': this.node.manager.options.userAgent
		};

		if (options.headers) headers = { ...headers, ...options.headers };

		const url = new URL(`${this.url}${endpoint}`);

		if (options.params) url.search = new URLSearchParams(options.params).toString();

		const abortController = new AbortController();
		const timeout = setTimeout(() => abortController.abort(), this.node.manager.options.restTimeout * 1000);

		const method = options.method?.toUpperCase() ?? 'GET';

		const finalFetchOptions: FinalFetchOptions = {
			method,
			headers,
			signal: abortController.signal
		};

		if (![ 'GET', 'HEAD' ].includes(method) && options.body)
			finalFetchOptions.body = JSON.stringify(options.body);

		const request = await fetch(url.toString(), finalFetchOptions)
			.finally(() => clearTimeout(timeout));

		if (!request.ok) {
			const response = await request
				.json()
				.catch(() => null) as LavalinkRestError | null;
			throw new RestError(response ?? {
				timestamp: Date.now(),
				status: request.status,
				error: 'Unknown Error',
				message: 'Unexpected error response from Lavalink server',
				path: endpoint
			});
		}
		try {
			return await request.json() as T;
		} catch {
			return;
		}
	}
}

type LavalinkRestError = Omit<RestError, 'cause' | 'name' | 'stack'>;

/**
 * Lavalink error response
 * @see https://lavalink.dev/api/rest.html#error-responses
 */
export class RestError extends Error {
	/**
	 * Timestamp in milliseconds since the Unix epoch
	 */
	public timestamp: number;
	/**
	 * HTTP status code
	 */
	public status: number;
	/**
	 * HTTP status code message
	 */
	public error: string;
	/**
	 * Stacktrace (sent when trace query parameter is true)
	 */
	public trace?: string;
	/**
	 * Request path
	 */
	public path: string;

	constructor({ timestamp, status, error, trace, message, path }: LavalinkRestError) {
		super(`Rest request failed with response code: ${status}${message ? ` | message: ${message}` : ''}`);
		this.name = 'RestError';
		this.timestamp = timestamp;
		this.status = status;
		this.error = error;
		this.trace = trace;
		this.message = message;
		this.path = path;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
