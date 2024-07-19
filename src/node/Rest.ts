import { Node, NodeInfo, Stats } from './Node';
import { NodeOption } from '../Shoukaku';
import { Versions } from '../Constants';
import { FilterOptions, PlayerState } from '../guild/Player';
import { OmitNested } from '../Utils';

/**
 * Severity of a Lavalink exception
 * @see https://lavalink.dev/api/websocket.html#severity
 */
export enum Severity {
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

/**
 * Type of resource loaded / status code
 * @see https://lavalink.dev/api/rest.html#load-result-type
 */
export enum LoadType {
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

/**
 * Represents a Lavalink track
 * @see https://lavalink.dev/api/rest.html#track
 */
export interface Track {
	/**
     * Base64 encoded track data
     */
	encoded: string;
	/**
     * Track information
     * @see https://lavalink.dev/api/rest.html#track-info
     */
	info: {
		/**
         * Track identifier
         */
		identifier: string;
		/**
         * Whether the track is seekable
         */
		isSeekable: boolean;
		/**
         * Track author
         */
		author: string;
		/**
         * Track length in milliseconds
         */
		length: number;
		/**
         * Whether the track is a (live)stream
         */
		isStream: boolean;
		/**
         * Track position in milliseconds
         */
		position: number;
		/**
         * Track title
         */
		title: string;
		/**
         * Track uri
         */
		uri?: string;
		/**
         * Track artwork url
         */
		artworkUrl?: string;
		/**
         * Track ISRC
         * @see https://en.wikipedia.org/wiki/International_Standard_Recording_Code
         */
		isrc?: string;
		/**
         * Track source name
         */
		sourceName: string;
	};
	/**
     * Additional track info provided by plugins
     */
	pluginInfo: Record<string, unknown>;
	/**
     * Additional track data provided via the Update Player endpoint
     * @see https://lavalink.dev/api/rest#update-player
     */
	userData: Record<string | number, unknown>;
}

/**
 * Represents a Lavalink playlist
 * @see https://lavalink.dev/api/rest.html#playlist-result-data
 */
export interface Playlist {
	encoded: string;
	/**
     * Playlist information
     * @see https://lavalink.dev/api/rest.html#playlist-info
     */
	info: {
		/**
         * Name of the playlist
         */
		name: string;
		/**
         * The selected track of the playlist (-1 if no track is selected)
         */
		selectedTrack: number;
	};
	/**
     * Additional playlist info provided by plugins
     */
	pluginInfo: Record<string, unknown>;
	/**
     * Tracks in the playlist
     * @see https://lavalink.dev/api/rest.html#track
     */
	tracks: Track[];
}

/**
 * Represents a Lavalink exception (error)
 */
export interface Exception {
	/**
     * Message of the exception
     */
	message?: string;
	/**
     * Severity of the exception
     * @see https://lavalink.dev/api/websocket.html#severity
     */
	severity: Severity;
	/**
     * Cause of the exception
     */
	cause: string;
}

/**
 * Track loading result when a track has been resolved
 * @see https://lavalink.dev/api/rest.html#track-loading-result
 */
export interface TrackResult {
	/**
     * Type of the result
     * @see https://lavalink.dev/api/rest.html#load-result-type
     */
	loadType: LoadType.TRACK;
	/**
     * Track object with loaded track
     * @see https://lavalink.dev/api/rest.html#load-result-data
     */
	data: Track;
}

/**
 * Track loading result when a playlist has been resolved
 * @see https://lavalink.dev/api/rest.html#track-loading-result
 */
export interface PlaylistResult {
	/**
     * Type of the result
     * @see https://lavalink.dev/api/rest.html#load-result-type
     */
	loadType: LoadType.PLAYLIST;
	/**
     * Playlist object with loaded playlist
     * @see https://lavalink.dev/api/rest.html#playlist-result-data
     */
	data: Playlist;
}

/**
 * Track loading result when a search query has been resolved
 * @see https://lavalink.dev/api/rest.html#track-loading-result
 */
export interface SearchResult {
	/**
     * Type of the result
     * @see https://lavalink.dev/api/rest.html#load-result-type
     */
	loadType: LoadType.SEARCH;
	/**
     * Array of Track objects from the search result
     * @see https://lavalink.dev/api/rest.html#search-result-data
     */
	data: Track[];
}

/**
 * Track loading result when there is no result
 * @see https://lavalink.dev/api/rest.html#track-loading-result
 */
export interface EmptyResult {
	/**
     * Type of the result
     * @see https://lavalink.dev/api/rest.html#load-result-type
     */
	loadType: LoadType.EMPTY;
	/**
     * Empty object
     * @see https://lavalink.dev/api/rest.html#empty-result-data
     */
	data: {};
}

/**
 * Track loading result when an error has occured
 * @see https://lavalink.dev/api/rest.html#track-loading-result
 */
export interface ErrorResult {
	/**
     * Type of the result
     * @see https://lavalink.dev/api/rest.html#load-result-type
     */
	loadType: LoadType.ERROR;
	/**
     * Exception object with the error
     * @see https://lavalink.dev/api/rest.html#error-result-data
     */
	data: Exception;
}

/**
 * All possible responses on the track loading endpoint
 * @see https://lavalink.dev/api/rest.html#track-loading-result
 */
export type LavalinkResponse = TrackResult | PlaylistResult | SearchResult | EmptyResult | ErrorResult;

/**
 * Type of route planner
 * @see https://lavalink.dev/api/rest.html#route-planner-types
 */
export enum RoutePlannerType {
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

/**
 * Type of IP block
 * @see https://lavalink.dev/api/rest#ip-block-type
 */
export enum IPBlockType {
	IPV4 = 'Inet4Address',
	IPV6 = 'Inet6Address'
}

/**
 * Failing IP Address
 * @see https://lavalink.dev/api/rest#failing-address-object
 */
export interface Address {
	/**
     * Failing IP address
     */
	address: string;
	/**
     * UNIX timestamp when the IP address failed
     */
	failingTimestamp: number;
	/**
     * Time when the IP address failed as a pretty string
     * @see https://docs.oracle.com/javase/8/docs/api/java/util/Date.html#toString--
     */
	failingTime: string;
}

/**
 * All possible keys in RoutePlanner
 * @see https://lavalink.dev/api/rest.html#routeplanner-api
 */
export interface GenericRoutePlanner {
	/**
     * Type of route planner
     * @see https://lavalink.dev/api/rest.html#route-planner-types
     */
	class: null | RoutePlannerType;
	/**
     * Information about the route planner
     * @see https://lavalink.dev/api/rest.html#details-object
     */
	details: null | {
		/**
         * IP block being used
         * @see https://lavalink.dev/api/rest#ip-block-object
         */
		ipBlock: {
			/**
             * Type of IP block
             * @see https://lavalink.dev/api/rest#ip-block-type
             */
			type: IPBlockType;
			/**
             * Size of IP block (number of IPs)
             */
			size: string;
		};
		/**
         * Array of failing IP addresses
         * @see https://lavalink.dev/api/rest#failing-address-object
         */
		failingAddresses: Address[];
		/**
         * Number of IP rotations
         */
		rotateIndex: string;
		/**
         * Current offset in the IP block
         */
		ipIndex: string;
		/**
         * Current IP address being used
         */
		currentAddress: string;
		/**
         * The information in which /64 block IPs are chosen, 
         * this number increases on each ban
         */
		blockIndex: string;
		/**
         * Current offset in the IP block
         */
		currentAddressIndex: string;
	};
}

/**
 * RoutePlanner response when using RotatingIpRoutePlanner
 * @see https://lavalink.dev/api/rest.html#details-object
 */
export interface RotatingIpRoutePlanner extends OmitNested<GenericRoutePlanner, 'details', 'currentAddressIndex' | 'blockIndex'> {
	class: RoutePlannerType.ROTATING_IP_ROUTE_PLANNER;
}

/**
 * RoutePlanner response when using NanoIpRoutePlanner
 * @see https://lavalink.dev/api/rest.html#details-object
 */
export interface NanoIpRoutePlanner extends OmitNested<GenericRoutePlanner, 'details', 'rotateIndex' | 'ipIndex' | 'currentAddress' | 'blockIndex'> {
	class: RoutePlannerType.NANO_IP_ROUTE_PLANNER;
}

/**
 * RoutePlanner response when using RotatingNanoIpRoutePlanner
 * @see https://lavalink.dev/api/rest.html#details-object
 */
export interface RotatingNanoIpRoutePlanner extends OmitNested<GenericRoutePlanner, 'details', 'rotateIndex' | 'ipIndex' | 'currentAddress'> {
	class: RoutePlannerType.ROTATING_NANO_IP_ROUTE_PLANNER;
}

/**
 * RoutePlanner response when using BalancingIpRoutePlanner
 * @see https://lavalink.dev/api/rest.html#details-object
 */
export interface BalancingIpRoutePlanner extends OmitNested<GenericRoutePlanner, 'details', 'rotateIndex' | 'ipIndex' | 'currentAddress' | 'currentAddressIndex' | 'blockIndex'> {
	class: RoutePlannerType.BALANCING_IP_ROUTE_PLANNER;
}

/**
 * Represents a RoutePlanner from the builtin Lavalink IP rotation extension
 * @see https://lavalink.dev/api/rest.html#routeplanner-api
 */
export type RoutePlanner = RotatingIpRoutePlanner | NanoIpRoutePlanner | RotatingNanoIpRoutePlanner | BalancingIpRoutePlanner;

// TODO: No idea what this is
export interface LavalinkPlayerVoice {
	token: string;
	endpoint: string;
	sessionId: string;
	connected?: boolean;
	ping?: number;
}

/**
 * Voice state of player
 * @see https://lavalink.dev/api/rest.html#voice-state
 */
export interface LavalinkPlayerVoiceOptions extends Omit<LavalinkPlayerVoice, 'connected' | 'ping'> {}

/**
 * Represents a Lavalink player
 * @see https://lavalink.dev/api/rest.html#player
 */
export interface LavalinkPlayer {
	/**
     * Guild id of the player
     */
	guildId: string;
	/**
     * Currently playing track
     */
	track?: Track;
	/**
     * Volume of the player, range 0-1000, in percentage
     */
	volume: number;
	/**
     * Whether the player is paused
     */
	paused: boolean;
	/**
     * State of the player
     */
	state: PlayerState;
	/**
     * Voice state of the player
     */
	voice: LavalinkPlayerVoice;
	/**
     * Filters used by the player
     */
	filters: FilterOptions;
}

interface GenericUpdatePlayerTrackOptions {
	/**
     * Additional track data to be sent back in the track object
     * @see https://lavalink.dev/api/rest#track
     */
	userData?: Record<string | number, unknown>;
}

interface EncodedUpdatePlayerTrackOptions extends GenericUpdatePlayerTrackOptions {
	/**
     * Base64 encoded track to play. null stops the current track
     */
	encoded: string | null;
	identifier?: never;
}

interface IdentifierUpdatePlayerTrackOptions extends GenericUpdatePlayerTrackOptions {
	encoded?: never;
	/**
     * Identifier of the track to play
     */
	identifier: string;
}

/**
 * Options for updating/creating the player's track
 * @see https://lavalink.dev/api/rest.html#update-player-track
 */
export type UpdatePlayerTrackOptions = EncodedUpdatePlayerTrackOptions | IdentifierUpdatePlayerTrackOptions;

/**
 * Options for updating/creating the player
 * @see https://lavalink.dev/api/rest.html#update-player
 */
export interface UpdatePlayerOptions {
	/**
     * Specification for a new track to load, as well as user data to set
     */
	track?: UpdatePlayerTrackOptions;
	/**
     * Track position in milliseconds
     */
	position?: number;
	/**
     * The track end time in milliseconds (must be > 0). null resets this if it was set previously
     */
	endTime?: number;
	/**
     * The player volume, in percentage, from 0 to 1000
     */
	volume?: number;
	/**
     * Whether the player is paused
     */
	paused?: boolean;
	/**
     * The new filters to apply, this will override all previously applied filters
     */
	filters?: FilterOptions;
	/**
     * Information required for connecting to Discord
     */
	voice?: LavalinkPlayerVoiceOptions;
}

/**
 * Options for updating/creating the player for a guild
 */
export interface UpdatePlayerInfo {
	/**
     * Discord guild ID
     */
	guildId: string;
	/**
     * Options for updating/creating the player
     */
	playerOptions: UpdatePlayerOptions;
	/**
     * Whether to replace the current track with the new track, defaults to false
     */
	noReplace?: boolean;
}

/**
 * Session information
 * @see https://lavalink.dev/api/rest.html#update-session
 */
export interface SessionInfo {
	// TODO: check why this is here
	// resumingKey?: string;
	/**
     * Whether resuming is enabled for this session or not
     */
	resuming: boolean;
	/**
     * The timeout in seconds (default is 60s)
     */
	timeout: number;
}

/**
 * @internal
 */
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

/**
 * @internal
 */
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
     * Rest version to use
     */
	protected readonly version: string;
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
		this.url = `${options.secure ? 'https' : 'http'}://${options.url}`;
		this.version = `/v${Versions.REST_VERSION}`;
		this.auth = options.auth;
	}

	protected get sessionId(): string {
		return this.node.sessionId!;
	}

	/**
     * Resolve a track
     * @param identifier Track ID
     * @returns A promise that resolves to a Lavalink response
     */
	public resolve(identifier: string): Promise<LavalinkResponse | undefined> {
		const options = {
			endpoint: '/loadtracks',
			options: { params: { identifier }}
		};
		return this.fetch(options);
	}

	/**
     * Decode a track
     * @param track Encoded track
     * @returns Promise that resolves to a track
     */
	public decode(track: string): Promise<Track | undefined> {
		const options = {
			endpoint: '/decodetrack',
			options: { params: { track }}
		};
		return this.fetch<Track>(options);
	}

	/**
     * Gets all the player with the specified sessionId
     * @returns Promise that resolves to an array of Lavalink players
     */
	public async getPlayers(): Promise<LavalinkPlayer[]> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/players`,
			options: {}
		};
		return await this.fetch<LavalinkPlayer[]>(options) ?? [];
	}

	/**
     * Gets the player with the specified guildId
     * @returns Promise that resolves to a Lavalink player
     */
	public getPlayer(guildId: string): Promise<LavalinkPlayer | undefined> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/players/${guildId}`,
			options: {}
		};
		return this.fetch(options);
	}

	/**
     * Updates a Lavalink player
     * @param data SessionId from Discord
     * @returns Promise that resolves to a Lavalink player
     */
	public updatePlayer(data: UpdatePlayerInfo): Promise<LavalinkPlayer | undefined> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/players/${data.guildId}`,
			options: {
				method: 'PATCH',
				params: { noReplace: data.noReplace?.toString() ?? 'false' },
				headers: { 'Content-Type': 'application/json' },
				body: data.playerOptions as Record<string, unknown>
			}
		};
		return this.fetch<LavalinkPlayer>(options);
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
		await this.fetch(options);
	}

	/**
     * Updates the session with a resume boolean and timeout
     * @param resuming Whether resuming is enabled for this session or not
     * @param timeout Timeout to wait for resuming
     * @returns Promise that resolves to a Lavalink player
     */
	public updateSession(resuming?: boolean, timeout?: number): Promise<SessionInfo | undefined> {
		const options = {
			endpoint: `/sessions/${this.sessionId}`,
			options: {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: { resuming, timeout }
			}
		};
		return this.fetch(options);
	}

	/**
     * Gets the status of this node
     * @returns Promise that resolves to a node stats response
     */
	public stats(): Promise<Stats | undefined> {
		const options = {
			endpoint: '/stats',
			options: {}
		};
		return this.fetch(options);
	}

	/**
     * Get routeplanner status from Lavalink
     * @returns Promise that resolves to a routeplanner response
     */
	public getRoutePlannerStatus(): Promise<RoutePlanner | undefined> {
		const options = {
			endpoint: '/routeplanner/status',
			options: {}
		};
		return this.fetch(options);
	}

	/**
     * Release blacklisted IP address into pool of IPs
     * @param address IP address
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
		await this.fetch(options);
	}

	/**
     * Get Lavalink info
     */
	public getLavalinkInfo(): Promise<NodeInfo | undefined> {
		const options = {
			endpoint: '/info',
			options: {
				headers: { 'Content-Type': 'application/json' }
			}
		};
		return this.fetch(options);
	}

	/**
     * Make a request to Lavalink
     * @param fetchOptions.endpoint Lavalink endpoint
     * @param fetchOptions.options Options passed to fetch
     * @throws `RestError` when encountering a Lavalink error response
     * @internal
     */
	protected async fetch<T = unknown>(fetchOptions: FetchOptions) {
		const { endpoint, options } = fetchOptions;
		let headers = {
			'Authorization': this.auth,
			'User-Agent': this.node.manager.options.userAgent
		};

		if (options.headers) headers = { ...headers, ...options.headers };

		const url = new URL(`${this.url}${this.version}${endpoint}`);

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

interface LavalinkRestError {
	timestamp: number;
	status: number;
	error: string;
	trace?: string;
	message: string;
	path: string;
}

export class RestError extends Error {
	public timestamp: number;
	public status: number;
	public error: string;
	public trace?: string;
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
