import { Node, NodeStats } from './Node';
import { NodeOption } from '../Shoukaku';
import { Versions } from '../Constants';
import { FilterOptions } from '../guild/Player';

export type LoadType = 'TRACK_LOADED' | 'PLAYLIST_LOADED' | 'SEARCH_RESULT' | 'NO_MATCHES' | 'LOAD_FAILED';

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

export interface Track {
    /** @deprecated */
    track: string;
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
        sourceName: string;
    }
}

export interface LavalinkResponse {
    loadType: LoadType;
    playlistInfo: {
        name?: string;
        selectedTrack?: number;
    }
    tracks: Track[]
}

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
    connected?: boolean;
    ping?: number
}

export interface LavalinkPlayerVoiceOptions extends Omit<LavalinkPlayerVoice, 'connected'|'ping'> {}

export interface LavalinkPlayer {
    guildId: string,
    track?: Track,
    volume: number;
    paused: boolean;
    voice: LavalinkPlayerVoice
    filters: FilterOptions
}

export interface UpdatePlayerOptions {
    encodedTrack?: string|null;
    identifier?: string;
    position?: number;
    endTime?: number;
    volume?: number;
    paused?: boolean;
    filters?:  FilterOptions;
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
     * Gets all the player with the specified sessionId
     * @returns Promise that resolves to an array of Lavalink players
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
                params: { noReplace: data.noReplace?.toString() || 'false' },
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
     * Updates the session with a resuming key and timeout
     * @param resumingKey Resuming key to set
     * @param timeout Timeout to wait for resuming
     * @returns Promise that resolves to a Lavalink player
     */
    public updateSession(resumingKey?: string, timeout?: number): Promise<SessionInfo | undefined> {
        const options = {
            endpoint: `/sessions/${this.sessionId}`,
            options: {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: { resumingKey, timeout }
            }
        };
        return this.fetch(options);
    }

    /**
     * Gets the status of this node
     * @returns Promise that resolves to a node stats response
     */
    public stats(): Promise<NodeStats | undefined> {
        const options = {
            endpoint: '/stats',
            options: {}
        };
        return this.fetch(options);
    }

    /**
     * Get routplanner status from Lavalink
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
     * Make a request to Lavalink
     * @param fetchOptions.endpoint Lavalink endpoint
     * @param fetchOptions.options Options passed to fetch
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

        const method = options.method?.toUpperCase() || 'GET';

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
                .catch(() => null);
            if (!response?.message)
                throw new Error(`Rest request failed with response code: ${request.status}`);
            else
                throw new Error(`Rest request failed with response code: ${request.status} | message: ${response.message}`);
        }
        try {
            return await request.json() as T;
        } catch {
            return;
        }
    }
}
