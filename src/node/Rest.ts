import { clearTimeout, setTimeout } from "node:timers";
import { Versions } from "../Constants.js";
import type { NodeOption } from "../Shoukaku.js";
import { fnOrVal, t, validatePluginRequirement } from "../Utils.js";
import type { FnOrVal, HintedString, PluginRequirement, TField, TReturnType } from "../Utils.js";
import type { FilterOptions } from "../guild/Player.js";
import type { Node, NodeInfo, NodeInfoPlugin, Stats } from "./Node.js";

export type Severity = "common" | "fault" | "suspicious";

export enum LoadType {
	EMPTY = "empty",
	ERROR = "error",
	PLAYLIST = "playlist",
	SEARCH = "search",
	TRACK = "track",
}

export interface Track {
	encoded: string;
	info: {
		artworkUrl?: string;
		author: string;
		identifier: string;
		isSeekable: boolean;
		isStream: boolean;
		isrc?: string;
		length: number;
		position: number;
		sourceName: string;
		title: string;
		uri?: string;
	};
	pluginInfo: unknown;
}

export interface Playlist {
	encoded: string;
	info: {
		name: string;
		selectedTrack: number;
	};
	pluginInfo: unknown;
	tracks: Track[];
}

export interface Exception {
	cause: string;
	message: string;
	severity: Severity;
}

export interface TrackResult {
	data: Track;
	loadType: LoadType.TRACK;
}

export interface PlaylistResult {
	data: Playlist;
	loadType: LoadType.PLAYLIST;
}

export interface SearchResult {
	data: Track[];
	loadType: LoadType.SEARCH;
}

export interface EmptyResult {
	data: Record<string, never>;
	loadType: LoadType.EMPTY;
}

export interface ErrorResult {
	data: Exception;
	loadType: LoadType.ERROR;
}

export type LavalinkResponse = EmptyResult | ErrorResult | PlaylistResult | SearchResult | TrackResult;

export interface Address {
	address: string;
	failingTime: string;
	failingTimestamp: number;
}

export interface RoutePlanner {
	class:
		| "BalancingIpRoutePlanner"
		| "NanoIpRoutePlanner"
		| "RotatingIpRoutePlanner"
		| "RotatingNanoIpRoutePlanner"
		| null;
	details: {
		blockIndex: string;
		currentAddress: string;
		currentAddressIndex: string;
		failingAddresses: Address[];
		ipBlock: {
			size: string;
			type: string;
		};
		ipIndex: string;
		rotateIndex: string;
	} | null;
}

export interface LavalinkPlayerVoice {
	channelId?: string;
	connected?: boolean;
	endpoint: string;
	ping?: number;
	sessionId: string;
	token: string;
}

export type LavalinkPlayerVoiceOptions = Required<Omit<LavalinkPlayerVoice, "connected" | "ping">>;

export interface LavalinkPlayer {
	filters: FilterOptions;
	guildId: string;
	paused: boolean;
	track?: Track;
	voice: LavalinkPlayerVoice;
	volume: number;
}

export interface UpdatePlayerTrackOptions {
	encoded?: string | null;
	identifier?: string;
	userData?: unknown;
}

export interface UpdatePlayerOptions {
	endTime?: number;
	filters?: FilterOptions;
	paused?: boolean;
	position?: number;
	track?: UpdatePlayerTrackOptions;
	voice?: LavalinkPlayerVoiceOptions;
	volume?: number;
}

export interface UpdatePlayerInfo {
	guildId: string;
	noReplace?: boolean;
	playerOptions: UpdatePlayerOptions;
}

export interface SessionInfo {
	resumingKey?: string;
	timeout: number;
}

interface FetchOptions {
	endpoint: string;
	options: {
		[key: string]: unknown;
		body?: Record<string, unknown>;
		headers?: Record<string, string>;
		method?: string;
		params?: Record<string, string>;
	};
}

interface FinalFetchOptions {
	body?: string;
	headers: Record<string, string>;
	method: string;
	signal: AbortSignal;
}

export class RestError extends Error {
	public timestamp: number;

	public status: number;

	public error: string;

	public trace?: string;

	public path: string;

	public constructor({ timestamp, status, error, trace, message, path }: LavalinkRestError) {
		super(`Rest request failed with response code: ${status}${message ? ` | message: ${message}` : ""}`);
		this.name = "RestError";
		this.timestamp = timestamp;
		this.status = status;
		this.error = error;
		this.trace = trace;
		this.message = message;
		this.path = path;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class DeserializationError extends Error {
	public constructor(cause: unknown) {
		super("Failed to deserialize Lavalink response: invalid JSON", { cause });
		this.name = "DeserializationError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

/**
 * Inject headers and params globally to a RestClient instance
 */
export interface RestMiddleware {
	readonly headers?: RestEndpoint["headers"];
	readonly params?: RestEndpoint["params"];
}

/**
 * Routes should implement this interface to use with fetch function
 *
 * Properties can be a value, or a function that returns a value to access `this`
 *
 * @example
 * Example with [LavaSearch](https://github.com/topi314/LavaSearch) `/loadsearch` endpoint
 * ```
 *	export class LoadSearchEndpoint implements RestEndpoint {
 *		constructor(public readonly query: string, public readonly types: string) {}
 *
 *		public readonly pluginRequired = {
 *			name: 'lavasearch-plugin',
 *			version: '^1.0.0'
 *		};
 *
 *		public readonly endpoint = '/loadsearch';
 *		public readonly params = () => ({ query: this.query, types: this.types });
 *
 *		public readonly T = t<{
 *			tracks?: Track[];
 *			albums?: Playlist[];
 *			artists?: Playlist[];
 *			playlists?: Playlist[];
 *			texts?: {
 *				text: string;
 *				plugin: Record<string, unknown>;
 *			};
 *			plugin: Record<string, unknown>;
 *		}>;
 *	}
 * ```
 */
export interface RestEndpoint extends TField {
	/**
	 * JSON body to send with
	 */
	readonly body?: FnOrVal<Record<string, unknown> | undefined>;
	/**
	 * Lavalink endpoint
	 */
	readonly endpoint: FnOrVal<string>;
	/**
	 * HTTP request headers
	 */
	readonly headers?: FnOrVal<Record<string, string> | undefined>;
	/**
	 * HTTP request method, `GET` by default
	 */
	readonly method?: HintedString<"DELETE" | "GET" | "PATCH" | "POST" | "PUT">;
	/**
	 * URL params
	 */
	readonly params?: FnOrVal<Record<string, string> | undefined>;
	/**
	 * Plugin required by endpoint
	 */
	readonly pluginRequired?: PluginRequirement;
}

export class NoopMiddleware implements RestMiddleware {}

export class ResolveEndpoint implements RestEndpoint {
	public constructor(public readonly identifier: string) {}

	public readonly endpoint = "/loadtracks";

	public readonly params = () => ({ identifier: this.identifier });

	public readonly T = t<LavalinkResponse>;
}

export class DecodeEndpoint implements RestEndpoint {
	public constructor(public readonly track: string) {}

	public readonly endpoint = "/decodetrack";

	public readonly params = () => ({ track: this.track });

	public readonly T = t<Track>;
}

export class GetPlayersEndpoint implements RestEndpoint {
	public constructor(public readonly sessionId: string) {}

	public readonly endpoint = () => `/sessions/${this.sessionId}/players`;

	public readonly T = t<LavalinkPlayer[]>;
}

export class GetPlayerEndpoint implements RestEndpoint {
	public constructor(
		public readonly sessionId: string,
		public readonly guildId: string,
	) {}

	public readonly endpoint = () => `/sessions/${this.sessionId}/players/${this.guildId}`;

	public readonly T = t<LavalinkPlayer>;
}

export class UpdatePlayerEndpoint implements RestEndpoint {
	public constructor(
		public readonly sessionId: string,
		public readonly data: UpdatePlayerInfo,
	) {}

	public readonly endpoint = () => `/sessions/${this.sessionId}/players/${this.data.guildId}`;

	public readonly method = "PATCH";

	public readonly params = () => ({ noReplace: this.data.noReplace?.toString() ?? "false" });

	public readonly headers = { "Content-Type": "application/json" };

	public readonly body = () => this.data.playerOptions as Record<string, unknown>;

	public readonly T = t<LavalinkPlayer>;
}

export class DestroyPlayerEndpoint implements RestEndpoint {
	public constructor(
		public readonly sessionId: string,
		public readonly guildId: string,
	) {}

	public readonly endpoint = () => `/sessions/${this.sessionId}/players/${this.guildId}`;

	public readonly method = "DELETE";

	public readonly T = t<void>;
}

export class UpdateSessionEndpoint implements RestEndpoint {
	public constructor(
		public readonly sessionId: string,
		public readonly resuming?: boolean,
		public readonly timeout?: number,
	) {}

	public readonly endpoint = () => `/sessions/${this.sessionId}`;

	public readonly method = "PATCH";

	public readonly headers = { "Content-Type": "application/json" };

	public readonly body = () => ({ resuming: this.resuming, timeout: this.timeout });

	public readonly T = t<SessionInfo>;
}

export class StatsEndpoint implements RestEndpoint {
	public readonly endpoint = "/stats";

	public readonly T = t<Stats>;
}

export class RoutePlannerStatusEndpoint implements RestEndpoint {
	public readonly endpoint = "/routeplanner/status";

	public readonly T = t<RoutePlanner>;
}

export class UnmarkFailedAddressEndpoint implements RestEndpoint {
	public constructor(public readonly address: string) {}

	public readonly endpoint = "/routeplanner/free/address";

	public readonly method = "POST";

	public readonly headers = { "Content-Type": "application/json" };

	public readonly body = () => ({ address: this.address });

	public readonly T = t<void>;
}

export class LavalinkInfoEndpoint implements RestEndpoint {
	public readonly endpoint = "/info";

	public readonly headers = { "Content-Type": "application/json" };

	public readonly T = t<NodeInfo>;
}

/**
 * Exendable generic REST client to make requests to Lavalink
 */
export class RestClient<TMiddleware extends RestMiddleware = NoopMiddleware> {
	/**
	 * @param auth - Credentials to access Lavalnk
	 * @param userAgent - User Agent to use when making requests to Lavalink
	 * @param baseUrl - URL of Lavalink
	 * @param restTimeout - Time to wait for a response from the Lavalink REST API before giving up
	 * @param nodePlugins - Plugins available on this node
	 * @param middleware - Inject headers and params globally, see {@link RestMiddleware}
	 */
	public constructor(
		protected readonly auth: string,
		protected readonly userAgent: string,
		protected readonly baseUrl: string,
		protected readonly restTimeout: number,
		protected nodePlugins: NodeInfoPlugin[] | null = null,
		protected readonly middleware: TMiddleware = new NoopMiddleware() as TMiddleware,
	) {}

	/**
	 * Get a list of plugins available on this node, you should use {@link Rest#getLavalinkInfo} instead
	 *
	 * @returns A list of plugins
	 * @internal
	 */
	public async _getNodePlugins() {
		if (!this.nodePlugins) {
			const info = await this.fetch(new LavalinkInfoEndpoint());
			this.nodePlugins = info?.plugins ?? [];
		}

		return this.nodePlugins;
	}

	/**
	 * Fetch data from endpoint based on config {@link RestEndpoint} and middleware
	 *
	 * @param endpoint - Endpoint config (see {@link RestEndpoint})
	 * @returns Response as specified by endpoint's `TResponse` function
	 * @throws {@link RestError} from Lavalink error response
	 * @throws {@link DeserializationError} when parsing response as JSON fails
	 * @throws {@link PluginError} when plugin required by endpoint is not satisfied by plugins on this node
	 */
	public async fetch<TEndpoint extends RestEndpoint, TResponse = TReturnType<TEndpoint>>(
		endpoint: TEndpoint,
	): Promise<TResponse | undefined> {
		const path = fnOrVal(endpoint.endpoint)!;

		// TODO: should we cache the plugin check somehow?
		if (endpoint.pluginRequired) {
			validatePluginRequirement(`endpoint ${path}`, endpoint.pluginRequired, await this._getNodePlugins());
		}

		const headers = {
			Authorization: this.auth,
			"User-Agent": this.userAgent,
			...fnOrVal(this.middleware.headers),
			...fnOrVal(endpoint.headers),
		};

		const url = new URL(`${this.baseUrl}${path}`);

		const searchParams = {
			...fnOrVal(this.middleware.params),
			...fnOrVal(endpoint.params),
		};

		url.search = new URLSearchParams(searchParams).toString();

		const abortController = new AbortController();
		const timeout = setTimeout(() => abortController.abort(), this.restTimeout * 1_000);

		const method = endpoint.method?.toUpperCase() ?? "GET";

		const finalFetchOptions: FinalFetchOptions = {
			method,
			headers,
			signal: abortController.signal,
		};

		const body = fnOrVal(endpoint.body);

		if (!["GET", "HEAD"].includes(method) && body) {
			finalFetchOptions.body = JSON.stringify(body);
		}

		const request = await fetch(url.toString(), finalFetchOptions).finally(() => clearTimeout(timeout));

		if (!request.ok) {
			const response = (await request.json().catch(() => null)) as LavalinkRestError | null;

			throw new RestError(
				response ?? {
					timestamp: Date.now(),
					status: request.status,
					error: "Unknown Error",
					message: "Unexpected error response from Lavalink server",
					path,
				},
			);
		}

		const text = await request.text().catch(() => "");

		if (!text) {
			return undefined;
		}

		try {
			return JSON.parse(text) as TResponse;
		} catch (error) {
			throw new DeserializationError(error);
		}
	}
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
	 * Client to make request to Lavalink
	 */
	public readonly client: RestClient;

	/**
	 * @param node - An instance of Node
	 * @param options - The options to initialize this rest class, see {@link NodeOption}
	 */
	public constructor(node: Node, options: NodeOption) {
		this.node = node;
		this.url = `${options.secure ? "https" : "http"}://${options.url}/v${Versions.REST_VERSION}`;
		this.auth = options.auth;
		this.client = new RestClient(
			this.auth,
			this.node.manager.options.userAgent,
			this.url,
			this.node.manager.options.restTimeout,
			// TODO: figure out if this is ever populated since Node#info is never reassigned from null
			this.node.info?.plugins,
		);
	}

	protected get sessionId(): string {
		return this.node.sessionId!;
	}

	/**
	 * Resolve a track
	 *
	 * @param identifier - Track ID
	 * @returns A promise that resolves to a Lavalink response
	 */
	public async resolve(identifier: string): Promise<LavalinkResponse | undefined> {
		return this.client.fetch(new ResolveEndpoint(identifier));
	}

	/**
	 * Decode a track
	 *
	 * @param track - Encoded track
	 * @returns Promise that resolves to a track
	 */
	public async decode(track: string): Promise<Track | undefined> {
		return this.client.fetch(new DecodeEndpoint(track));
	}

	/**
	 * Gets all the player with the specified sessionId
	 *
	 * @returns Promise that resolves to an array of Lavalink players
	 */
	public async getPlayers(): Promise<LavalinkPlayer[]> {
		return (await this.client.fetch(new GetPlayersEndpoint(this.sessionId))) ?? [];
	}

	/**
	 * Gets the player with the specified guildId
	 *
	 * @returns Promise that resolves to a Lavalink player
	 */
	public async getPlayer(guildId: string): Promise<LavalinkPlayer | undefined> {
		return this.client.fetch(new GetPlayerEndpoint(this.sessionId, guildId));
	}

	/**
	 * Updates a Lavalink player
	 *
	 * @param data - SessionId from Discord
	 * @returns Promise that resolves to a Lavalink player
	 */
	public async updatePlayer(data: UpdatePlayerInfo): Promise<LavalinkPlayer | undefined> {
		return this.client.fetch(new UpdatePlayerEndpoint(this.sessionId, data));
	}

	/**
	 * Deletes a Lavalink player
	 *
	 * @param guildId - guildId where this player is
	 */
	public async destroyPlayer(guildId: string): Promise<void> {
		return this.client.fetch(new DestroyPlayerEndpoint(this.sessionId, guildId));
	}

	/**
	 * Updates the session with a resume boolean and timeout
	 *
	 * @param resuming - Whether resuming is enabled for this session or not
	 * @param timeout - Timeout to wait for resuming
	 * @returns Promise that resolves to a Lavalink player
	 */
	public async updateSession(resuming?: boolean, timeout?: number): Promise<SessionInfo | undefined> {
		return this.client.fetch(new UpdateSessionEndpoint(this.sessionId, resuming, timeout));
	}

	/**
	 * Gets the status of this node
	 *
	 * @returns Promise that resolves to a node stats response
	 */
	public async stats(): Promise<Stats | undefined> {
		return this.client.fetch(new StatsEndpoint());
	}

	/**
	 * Get routeplanner status from Lavalink
	 *
	 * @returns Promise that resolves to a routeplanner response
	 */
	public async getRoutePlannerStatus(): Promise<RoutePlanner | undefined> {
		return this.client.fetch(new RoutePlannerStatusEndpoint());
	}

	/**
	 * Release blacklisted IP address into pool of IPs
	 *
	 * @param address - IP address
	 */
	public async unmarkFailedAddress(address: string): Promise<void> {
		return this.client.fetch(new UnmarkFailedAddressEndpoint(address));
	}

	/**
	 * Get Lavalink info
	 */
	public async getLavalinkInfo(): Promise<NodeInfo | undefined> {
		return this.client.fetch(new LavalinkInfoEndpoint());
	}

	/**
	 * Make a request to Lavalink
	 *
	 * @throws `RestError` when encountering a Lavalink error response
	 * @deprecated Use this.client.fetch() instead, see {@link RestClient#fetch}
	 * @internal
	 */
	protected async fetch<TResponse = unknown>(fetchOptions: FetchOptions): Promise<TResponse | undefined> {
		const endpoint = new (class implements RestEndpoint {
			public readonly endpoint = fetchOptions.endpoint;

			public readonly method = fetchOptions.options.method;

			public readonly headers = fetchOptions.options.headers;

			public readonly params = fetchOptions.options.params;

			public readonly body = fetchOptions.options.body;

			public readonly T = t<TResponse>;
		})();

		return this.client.fetch<typeof endpoint, TResponse>(endpoint);
	}
}

interface LavalinkRestError {
	error: string;
	message: string;
	path: string;
	status: number;
	timestamp: number;
	trace?: string;
}
