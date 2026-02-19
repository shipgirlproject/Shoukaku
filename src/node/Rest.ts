import { Versions } from '../Constants';
import type { FilterOptions } from '../guild/Player';
import type { NodeOption } from '../Shoukaku';
import { t, validatePluginRequirement } from '../Utils';
import type { HintedString, PluginRequirement } from '../Utils';
import type { Node, NodeInfo, NodeInfoPlugin, Stats } from './Node';

export type Severity = 'common' | 'suspicious' | 'fault';

export enum LoadType {
	TRACK = 'track',
	PLAYLIST = 'playlist',
	SEARCH = 'search',
	EMPTY = 'empty',
	ERROR = 'error'
}

export interface Track {
	encoded: string;
	info: {
		identifier: string;
		isSeekable: boolean;
		author: string;
		length: number;
		isStream: boolean;
		position: number;
		title: string;
		uri?: string;
		artworkUrl?: string;
		isrc?: string;
		sourceName: string;
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
	message: string;
	severity: Severity;
	cause: string;
}

export interface TrackResult {
	loadType: LoadType.TRACK;
	data: Track;
}

export interface PlaylistResult {
	loadType: LoadType.PLAYLIST;
	data: Playlist;
}

export interface SearchResult {
	loadType: LoadType.SEARCH;
	data: Track[];
}

export interface EmptyResult {
	loadType: LoadType.EMPTY;
	data: Record<string, never>;
}

export interface ErrorResult {
	loadType: LoadType.ERROR;
	data: Exception;
}

export type LavalinkResponse = TrackResult | PlaylistResult | SearchResult | EmptyResult | ErrorResult;

export interface Address {
	address: string;
	failingTimestamp: number;
	failingTime: string;
}

export interface RoutePlanner {
	class: null | 'RotatingIpRoutePlanner' | 'NanoIpRoutePlanner' | 'RotatingNanoIpRoutePlanner' | 'BalancingIpRoutePlanner';
	details: null | {
		ipBlock: {
			type: string;
			size: string;
		};
		failingAddresses: Address[];
		rotateIndex: string;
		ipIndex: string;
		currentAddress: string;
		blockIndex: string;
		currentAddressIndex: string;
	};
}

export interface LavalinkPlayerVoice {
	token: string;
	endpoint: string;
	sessionId: string;
	channelId?: string;
	connected?: boolean;
	ping?: number;
}

export type LavalinkPlayerVoiceOptions = Required<Omit<LavalinkPlayerVoice, 'connected' | 'ping'>>;

export interface LavalinkPlayer {
	guildId: string;
	track?: Track;
	volume: number;
	paused: boolean;
	voice: LavalinkPlayerVoice;
	filters: FilterOptions;
}

export interface UpdatePlayerTrackOptions {
	encoded?: string | null;
	identifier?: string;
	userData?: unknown;
}

export interface UpdatePlayerOptions {
	track?: UpdatePlayerTrackOptions;
	position?: number;
	endTime?: number;
	volume?: number;
	paused?: boolean;
	filters?: FilterOptions;
	voice?: LavalinkPlayerVoiceOptions;
}

export interface UpdatePlayerInfo {
	guildId: string;
	playerOptions: UpdatePlayerOptions;
	noReplace?: boolean;
}

export interface SessionInfo {
	resumingKey?: string;
	timeout: number;
}

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

type FnOrVal<T> = T | (() => T);

function fnOrVal<T>(input?: T | (() => T)): T | undefined {
	return typeof input === 'function' ? (input as () => T)?.() : input;
}

/**
 * Inject headers and params globally to a RestClient instance
 */
export interface RestMiddleware {
	readonly headers?: RestEndpoint['headers'];
	readonly params?: RestEndpoint['params'];
}

/**
 * Routes should implement this interface to use with fetch function
 * 
 * Properties can be a value, or a function that returns a value to access `this`
 */
export interface RestEndpoint {
	// TODO: do we even need this? RestError 404/400 would also indicate missing/wrong version of plugin
	/**
	 * Plugin required by endpoint
	 */
	readonly pluginRequired?: PluginRequirement;
	/**
	 * Lavalink endpoint
	 */
	readonly endpoint: FnOrVal<string>;
	/**
	 * HTTP request method
	 */
	readonly method?: HintedString<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>;
	/**
	 * HTTP request headers
	 */
	readonly headers?: FnOrVal<Record<string, string>>;
	/**
	 * URL params
	 */
	readonly params?: FnOrVal<Record<string, string>>;
	/**
	 * JSON body to send with
	 */
	readonly body?: FnOrVal<Record<string, unknown>>;
	/**
	 * This hack is to work around TypeScript types not existing at runtime.
	 * We can specify the return type of the endpoint in the fetch function here.
	 * 
	 * @example
	 * This function is never actually called, so the implementation can be simply:
	 * ```
	 * R = (response: unknown) => response as LavalinkResponse;
	 * ```
	 */
	R(response: unknown): unknown;
};

export class NoopMiddleware implements RestMiddleware {}

/**
 * Exendable generic REST client to make requests to Lavalink
 */
export class RestClient<T extends RestMiddleware = NoopMiddleware> {
	protected _nodePlugins?: NodeInfoPlugin[];

	/**
	 * @param auth Credentials to access Lavalnk
	 * @param userAgent User Agent to use when making requests to Lavalink
	 * @param baseUrl URL of Lavalink
	 * @param restTimeout Time to wait for a response from the Lavalink REST API before giving up
	 * @param middleware Inject headers and params globally, see {@link RestMiddleware}
	 */
	constructor(
		protected readonly auth: string,
		protected readonly userAgent: string,
		protected readonly baseUrl: string,
		protected readonly restTimeout: number,
		protected readonly middleware: T = new NoopMiddleware() as T
	) {
		return this as RestClient<typeof middleware>;
	}

	private async getNodePlugins() {
		if (!this._nodePlugins) {
			const info = await this.fetch(new LavalinkInfoEndpoint());
			this._nodePlugins = info?.plugins ?? [];
		}

		return this._nodePlugins;
	}

	/**
	 * Fetch data from endpoint based on config {@link RestEndpoint} and middleware
	 * @param endpoint Endpoint config (see {@link RestEndpoint})
	 * @returns Response as specified by endpoint's `R` function
	 * @throws {@link RestError} from Lavalink error response
	 * @throws {@link DeserializationError} when parsing response as JSON fails
	 * @throws {@link PluginError} when plugin required by endpoint is not satisfied by plugins on this node
	 */
	public async fetch<
		E extends RestEndpoint,
		R = ReturnType<E['R']>
	>(endpoint: E): Promise<R | undefined> {
		const path = fnOrVal(endpoint.endpoint)!;

		// TODO: should we cache the plugin check somehow?
		if (endpoint.pluginRequired)
			validatePluginRequirement(`endpoint ${path}`, endpoint.pluginRequired, await this.getNodePlugins());

		const headers = {
			'Authorization': this.auth,
			'User-Agent': this.userAgent,
			...(fnOrVal(this.middleware.headers) ?? {}),
			...(fnOrVal(endpoint.headers) ?? {})
		};

		const url = new URL(`${this.baseUrl}${path}`);

		const searchParams = {
			...(fnOrVal(this.middleware.params) ?? {}),
			...(fnOrVal(endpoint.params) ?? {})
		};

		url.search = new URLSearchParams(searchParams).toString();

		const abortController = new AbortController();
		const timeout = setTimeout(() => abortController.abort(), this.restTimeout * 1000);

		const method = endpoint.method?.toUpperCase() ?? 'GET';

		const finalFetchOptions: FinalFetchOptions = {
			method,
			headers,
			signal: abortController.signal
		};

		const body = fnOrVal(endpoint.body);

		if (![ 'GET', 'HEAD' ].includes(method) && body)
			finalFetchOptions.body = JSON.stringify(body);

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
				path: path
			});
		}

		try {
			return await request.json() as R;
		} catch (e) {
			throw new DeserializationError(e);
		}

	}
}

export class ResolveEndpoint implements RestEndpoint {
	constructor (public readonly identifier: string) {}

	public readonly endpoint = '/loadtracks';
	public readonly params = () => ({ identifier: this.identifier });

	public R = t<LavalinkResponse>;
}

export class DecodeEndpoint implements RestEndpoint {
	constructor (public readonly track: string) {}

	public readonly endpoint = '/decodetrack';
	public readonly params = () => ({ track: this.track });

	public R = t<Track>;
}

export class GetPlayersEndpoint implements RestEndpoint {
	constructor (public readonly sessionId: string) {}

	public readonly endpoint = () => `/sessions/${this.sessionId}/players`;

	public R = t<LavalinkPlayer[]>;
}

export class GetPlayerEndpoint implements RestEndpoint {
	constructor (public readonly sessionId: string, public readonly guildId: string) {}

	public readonly endpoint = () => `/sessions/${this.sessionId}/players/${this.guildId}`;

	public R = t<LavalinkPlayer>;
}

export class UpdatePlayerEndpoint implements RestEndpoint {
	constructor (public readonly sessionId: string, public readonly data: UpdatePlayerInfo) {}

	public readonly endpoint = () => `/sessions/${this.sessionId}/players/${this.data.guildId}`;

	public readonly method = 'PATCH';
	public readonly params = () => ({ noReplace: this.data.noReplace?.toString() ?? 'false' });
	public readonly headers = { 'Content-Type': 'application/json' };
	public readonly body = () => this.data.playerOptions as Record<string, unknown>;

	public R = t<LavalinkPlayer>;
}

export class DestroyPlayerEndpoint implements RestEndpoint {
	constructor (public readonly sessionId: string, public readonly guildId: string) {}

	public readonly endpoint = () => `/sessions/${this.sessionId}/players/${this.guildId}`;

	public readonly method = 'DELETE';

	public R = t<void>;
}

export class UpdateSessionEndpoint implements RestEndpoint {
	constructor (
		public readonly sessionId: string,
		public readonly resuming?: boolean,
		public readonly timeout?: number
	) {}

	public readonly endpoint = () => `/sessions/${this.sessionId}`;

	public readonly method = 'PATCH';
	public readonly headers = { 'Content-Type': 'application/json' };
	public readonly body = () => ({ resuming: this.resuming, timeout: this.timeout });

	public R = t<SessionInfo>;
}

export class StatsEndpoint implements RestEndpoint {
	public readonly endpoint = '/stats';

	public R = t<Stats>;
}

export class RoutePlannerStatusEndpoint implements RestEndpoint {
	public readonly endpoint = '/routeplanner/status';

	public R = t<RoutePlanner>;
}

export class UnmarkFailedAddressEndpoint implements RestEndpoint {
	constructor (public readonly address: string) {}

	public readonly endpoint = '/routeplanner/free/address';

	public readonly method = 'POST';
	public readonly headers = { 'Content-Type': 'application/json' };
	public readonly body = () => ({ address: this.address });

	public R = t<void>;
}

export class LavalinkInfoEndpoint implements RestEndpoint {
	public readonly endpoint = '/info';

	public readonly headers = { 'Content-Type': 'application/json' };

	public R = t<NodeInfo>;
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
	protected readonly client: RestClient;
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
		this.client = new RestClient(
			this.auth,
			this.node.manager.options.userAgent,
			this.url,
			this.node.manager.options.restTimeout
		);
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
		return this.client.fetch(new ResolveEndpoint(identifier));
	}

	/**
	 * Decode a track
	 * @param track Encoded track
	 * @returns Promise that resolves to a track
	 */
	public decode(track: string): Promise<Track | undefined> {
		return this.client.fetch(new DecodeEndpoint(track));
	}

	/**
	 * Gets all the player with the specified sessionId
	 * @returns Promise that resolves to an array of Lavalink players
	 */
	public async getPlayers(): Promise<LavalinkPlayer[] | undefined> {
		return this.client.fetch(new GetPlayersEndpoint(this.sessionId));
	}

	/**
	 * Gets the player with the specified guildId
	 * @returns Promise that resolves to a Lavalink player
	 */
	public getPlayer(guildId: string): Promise<LavalinkPlayer | undefined> {
		return this.client.fetch(new GetPlayerEndpoint(this.sessionId, guildId));
	}

	/**
	 * Updates a Lavalink player
	 * @param data SessionId from Discord
	 * @returns Promise that resolves to a Lavalink player
	 */
	public updatePlayer(data: UpdatePlayerInfo): Promise<LavalinkPlayer | undefined> {
		return this.client.fetch(new UpdatePlayerEndpoint(this.sessionId, data));
	}

	/**
	 * Deletes a Lavalink player
	 * @param guildId guildId where this player is
	 */
	public async destroyPlayer(guildId: string): Promise<void> {
		return this.client.fetch(new DestroyPlayerEndpoint(this.sessionId, guildId));
	}

	/**
	 * Updates the session with a resume boolean and timeout
	 * @param resuming Whether resuming is enabled for this session or not
	 * @param timeout Timeout to wait for resuming
	 * @returns Promise that resolves to a Lavalink player
	 */
	public updateSession(resuming?: boolean, timeout?: number): Promise<SessionInfo | undefined> {
		return this.client.fetch(new UpdateSessionEndpoint(this.sessionId, resuming, timeout));
	}

	/**
	 * Gets the status of this node
	 * @returns Promise that resolves to a node stats response
	 */
	public stats(): Promise<Stats | undefined> {
		return this.client.fetch(new StatsEndpoint());
	}

	/**
	 * Get routeplanner status from Lavalink
	 * @returns Promise that resolves to a routeplanner response
	 */
	public getRoutePlannerStatus(): Promise<RoutePlanner | undefined> {
		return this.client.fetch(new RoutePlannerStatusEndpoint());
	}

	/**
	 * Release blacklisted IP address into pool of IPs
	 * @param address IP address
	 */
	public async unmarkFailedAddress(address: string): Promise<void> {
		return this.client.fetch(new UnmarkFailedAddressEndpoint(address));
	}

	/**
	 * Get Lavalink info
	 */
	public getLavalinkInfo(): Promise<NodeInfo | undefined> {
		return this.client.fetch(new LavalinkInfoEndpoint());
	}

	/**
	 * Make a request to Lavalink
	 * @param fetchOptions.endpoint Lavalink endpoint
	 * @param fetchOptions.options Options passed to fetch
	 * @throws `RestError` when encountering a Lavalink error response
	 * @deprecated Use this.client.fetch() instead, see {@link RestClient#fetch}
	 * @internal
	 */
	protected async fetch<T = unknown>(fetchOptions: FetchOptions) {
		return this.client.fetch(new class implements RestEndpoint {
			public readonly endpoint = fetchOptions.endpoint;

			public readonly method = fetchOptions.options.method;
			public readonly headers = fetchOptions.options.headers;
			public readonly params = fetchOptions.options.params;
			public readonly body = fetchOptions.options.body;

			public R = t<T>;
		});
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

export class DeserializationError extends Error {
	constructor(cause: unknown) {
		super('Failed to deserialize Lavalink response: invalid JSON', { cause });
		this.name = 'DeserializationError';
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
