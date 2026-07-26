import { clearTimeout, setTimeout } from "node:timers";
import { Versions } from "../Constants.js";
import type { NodeOption } from "../Shoukaku.js";
import type { FilterOptions } from "../guild/Player.js";
import type { Node, NodeInfo, Stats } from "./Node.js";

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

	public constructor(node: Node, options: NodeOption) {
		this.node = node;
		this.url = `${options.secure ? "https" : "http"}://${options.url}/v${Versions.REST_VERSION}`;
		this.auth = options.auth;
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
		const options = {
			endpoint: "/loadtracks",
			options: { params: { identifier } },
		};
		return this.fetch(options);
	}

	/**
	 * Decode a track
	 *
	 * @param track - Encoded track
	 * @returns Promise that resolves to a track
	 */
	public async decode(track: string): Promise<Track | undefined> {
		const options = {
			endpoint: "/decodetrack",
			options: { params: { track } },
		};
		return this.fetch<Track>(options);
	}

	/**
	 * Gets all the player with the specified sessionId
	 *
	 * @returns Promise that resolves to an array of Lavalink players
	 */
	public async getPlayers(): Promise<LavalinkPlayer[]> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/players`,
			options: {},
		};
		return (await this.fetch<LavalinkPlayer[]>(options)) ?? [];
	}

	/**
	 * Gets the player with the specified guildId
	 *
	 * @returns Promise that resolves to a Lavalink player
	 */
	public async getPlayer(guildId: string): Promise<LavalinkPlayer | undefined> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/players/${guildId}`,
			options: {},
		};
		return this.fetch(options);
	}

	/**
	 * Updates a Lavalink player
	 *
	 * @param data - SessionId from Discord
	 * @returns Promise that resolves to a Lavalink player
	 */
	public async updatePlayer(data: UpdatePlayerInfo): Promise<LavalinkPlayer | undefined> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/players/${data.guildId}`,
			options: {
				method: "PATCH",
				params: { noReplace: data.noReplace?.toString() ?? "false" },
				headers: { "Content-Type": "application/json" },
				body: data.playerOptions as Record<string, unknown>,
			},
		};
		return this.fetch<LavalinkPlayer>(options);
	}

	/**
	 * Deletes a Lavalink player
	 *
	 * @param guildId - guildId where this player is
	 */
	public async destroyPlayer(guildId: string): Promise<void> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/players/${guildId}`,
			options: { method: "DELETE" },
		};
		await this.fetch(options);
	}

	/**
	 * Updates the session with a resume boolean and timeout
	 *
	 * @param resuming - Whether resuming is enabled for this session or not
	 * @param timeout - Timeout to wait for resuming
	 * @returns Promise that resolves to a Lavalink player
	 */
	public async updateSession(resuming?: boolean, timeout?: number): Promise<SessionInfo | undefined> {
		const options = {
			endpoint: `/sessions/${this.sessionId}`,
			options: {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: { resuming, timeout },
			},
		};
		return this.fetch(options);
	}

	/**
	 * Gets the status of this node
	 *
	 * @returns Promise that resolves to a node stats response
	 */
	public async stats(): Promise<Stats | undefined> {
		const options = {
			endpoint: "/stats",
			options: {},
		};
		return this.fetch(options);
	}

	/**
	 * Get routeplanner status from Lavalink
	 *
	 * @returns Promise that resolves to a routeplanner response
	 */
	public async getRoutePlannerStatus(): Promise<RoutePlanner | undefined> {
		const options = {
			endpoint: "/routeplanner/status",
			options: {},
		};
		return this.fetch(options);
	}

	/**
	 * Release blacklisted IP address into pool of IPs
	 *
	 * @param address - IP address
	 */
	public async unmarkFailedAddress(address: string): Promise<void> {
		const options = {
			endpoint: "/routeplanner/free/address",
			options: {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: { address },
			},
		};
		await this.fetch(options);
	}

	/**
	 * Get Lavalink info
	 */
	public async getLavalinkInfo(): Promise<NodeInfo | undefined> {
		const options = {
			endpoint: "/info",
			options: {
				headers: { "Content-Type": "application/json" },
			},
		};
		return this.fetch(options);
	}

	/**
	 * Make a request to Lavalink
	 *
	 * @throws `RestError` when encountering a Lavalink error response
	 * @internal
	 */
	protected async fetch<TResponse = unknown>(fetchOptions: FetchOptions): Promise<TResponse | undefined> {
		const { endpoint, options } = fetchOptions;

		const headers: Record<string, string> = {
			Authorization: this.auth,
			"User-Agent": this.node.manager.options.userAgent,
			...options.headers,
		};

		const url = new URL(`${this.url}${endpoint}`);

		if (options.params) {
			url.search = new URLSearchParams(options.params).toString();
		}

		const abortController = new AbortController();
		const timeout = setTimeout(() => abortController.abort(), this.node.manager.options.restTimeout * 1_000);

		const method = options.method?.toUpperCase() ?? "GET";

		try {
			const response = await fetch(url.toString(), {
				method,
				headers,
				signal: abortController.signal,
				body: !["GET", "HEAD"].includes(method) && options.body ? JSON.stringify(options.body) : undefined,
			} as FinalFetchOptions);

			if (!response.ok) {
				const errorBody = (await response.json().catch(() => null)) as LavalinkRestError | null;

				throw new RestError(
					errorBody ?? {
						timestamp: Date.now(),
						status: response.status,
						error: "Unknown Error",
						message: "Unexpected error response from Lavalink server",
						path: endpoint,
					},
				);
			}

			const text = await response.text().catch(() => "");

			if (!text) {
				return undefined;
			}

			try {
				return JSON.parse(text) as TResponse;
			} catch {
				return undefined;
			}
		} finally {
			clearTimeout(timeout);
		}
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
