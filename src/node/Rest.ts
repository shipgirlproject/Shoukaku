import { Versions } from '../Constants';
import type { NodeInfo, Stats } from '../model/Node';
import type {
	LavalinkPlayer,
	LavalinkResponse,
	RoutePlanner,
	SessionInfo,
	Track,
	UpdatePlayerOptions
} from '../model/Rest';
import type { NodeOption } from '../Shoukaku';
import { validate } from '../Utils';
import type { Node } from './Node';

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
	 * @param node An instance of Node
	 * @param options The options to initialize this rest class
	 * @param options.name Name of this node
	 * @param options.url URL of Lavalink
	 * @param options.auth Credentials to access Lavalink
	 * @param options.secure Weather to use secure protocols or not
	 * @param options.group Group of this node
	 */
	constructor(node: Node, options: NodeOption) {
		this.node = node;
		this.url = `${options.secure ? 'https' : 'http'}://${options.url}/v${Versions.REST_VERSION}`;
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
	public async resolve(identifier: string): Promise<LavalinkResponse> {
		const options = {
			endpoint: '/loadtracks',
			options: { params: { identifier }}
		};

		return validate(await this.fetch<LavalinkResponse>(options));
	}

	/**
	 * Decode a track
	 * @param track Encoded track
	 * @returns Promise that resolves to a track
	 */
	public async decode(track: string): Promise<Track> {
		const options = {
			endpoint: '/decodetrack',
			options: { params: { track }}
		};

		return validate(await this.fetch<Track>(options));
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

		return validate(await this.fetch<LavalinkPlayer[]>(options));
	}

	/**
	 * Gets the player with the specified guildId
	 * @returns Promise that resolves to a Lavalink player
	 */
	public async getPlayer(guildId: string): Promise<LavalinkPlayer> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/players/${guildId}`,
			options: {}
		};

		return validate(await this.fetch(options));
	}

	/**
	 * Updates a Lavalink player
	 * @param guildId GuildId of the player you want to update
	 * @param updatePlayerOptions Data to update on the player
	 * @param noReplace If you want this action to do nothing when the player is active
	 * @returns Promise that resolves to a Lavalink player
	 */
	public async updatePlayer(guildId: string, updatePlayerOptions: UpdatePlayerOptions, noReplace = false): Promise<LavalinkPlayer> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/players/${guildId}`,
			options: {
				method: 'PATCH',
				params: { noReplace: noReplace?.toString() ?? 'false' },
				headers: { 'Content-Type': 'application/json' },
				body: updatePlayerOptions as Record<string, unknown>
			}
		};

		return validate(await this.fetch<LavalinkPlayer>(options));
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
	public async updateSession(resuming?: boolean, timeout?: number): Promise<SessionInfo> {
		const options = {
			endpoint: `/sessions/${this.sessionId}`,
			options: {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: { resuming, timeout }
			}
		};

		return validate(await this.fetch(options));
	}

	/**
	 * Gets the status of this node
	 * @returns Promise that resolves to a node stats response
	 */
	public async stats(): Promise<Stats> {
		const options = {
			endpoint: '/stats',
			options: {}
		};

		return validate(await this.fetch(options));
	}

	/**
	 * Get routeplanner status from Lavalink
	 * @returns Promise that resolves to a routeplanner response
	 */
	public async getRoutePlannerStatus(): Promise<RoutePlanner> {
		const options = {
			endpoint: '/routeplanner/status',
			options: {}
		};

		return validate(await this.fetch(options));
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
	public async getLavalinkInfo(): Promise<NodeInfo> {
		const options = {
			endpoint: '/info',
			options: {
				headers: { 'Content-Type': 'application/json' }
			}
		};

		return validate(await this.fetch(options));
	}

	/**
	 * Make a request to Lavalink
	 * @param fetchOptions.endpoint Lavalink endpoint
	 * @param fetchOptions.options Options passed to fetch
	 * @throws `RestError` when encountering a Lavalink error response
	 * @internal
	 */
	protected async fetch<T = unknown>(fetchOptions: FetchOptions): Promise<T | undefined> {
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

		if (request.body) return undefined;

		return await request.json() as T;
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
