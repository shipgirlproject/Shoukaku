import { Node } from './Node';
import { NodeOption } from '../Shoukaku';
import Petitio, { HTTPMethod } from 'petitio';

export type LoadType = 'TRACK_LOADED' | 'PLAYLIST_LOADED' | 'SEARCH_RESULT' | 'NO_MATCHES' | 'LOAD_FAILED';

interface FetchOptions {
    endpoint: string;
    options: {
        headers?: Record<string, string>;
        params?: Record<string, string>;
        method?: HTTPMethod;
        body?: Record<string, unknown>;
        [key: string]: unknown;
    };
}

export interface Track {
    track: string;
    info: {
        identifier: string;
        isSeekable: boolean;
        author: string;
        length: number;
        isStream: boolean;
        position: number;
        title: string;
        uri: string;
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
    class?: string;
    details?: {
        ipBlock: {
            type: string;
            size: string;
        },
        failingAddresses: Address[]
    }
    rotateIndex?: string;
    ipIndex?: string;
    currentAddress?: string;
    blockIndex?: string;
    currentAddressIndex?: string;
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
     * @param options.name Name of this node
     * @param options.url URL of Lavalink
     * @param options.auth Credentials to access Lavalnk
     * @param options.secure Weather to use secure protocols or not
     * @param options.group Group of this node
     */
    constructor(node: Node, options: NodeOption) {
        this.node = node;
        this.url = `${options.secure ? 'https' : 'http'}://${options.url}`;
        this.auth = options.auth;
    }

    /**
     * Resolve a track
     * @param identifier Track ID
     * @returns A promise that resolves to a Lavalink response or void
     */
    public async resolve(identifier: string): Promise<LavalinkResponse|null> {
        const options = {
            endpoint: '/loadtracks',
            options: { params: { identifier }}
        };

        return this.fetch<LavalinkResponse>(options);
    }

    /**
     * Decode a track
     * @param track Encoded track
     * @returns Promise that resolves to a track or void
     */
    public async decode(track: string): Promise<Track|null> {
        const options = {
            endpoint: '/decodetrack',
            options: { params: { track }}
        };

        return this.fetch<Track>(options);
    }

    /**
     * Get routplanner status from Lavalink
     * @returns Promise that resolves to a routeplanner response or void
     * @internal
     */
    public async getRoutePlannerStatus(): Promise<RoutePlanner|null> {
        const options = {
            endpoint: '/routeplanner/status',
            options: {}
        };

        return this.fetch<RoutePlanner>(options);
    }

    /**
     * Release blacklisted IP address into pool of IPs
     * @param address IP address
     * @internal
     */
    public async unmarkFailedAddress(address: string): Promise<void | null> {
        const options = {
            endpoint: '/routeplanner/free/address',
            options: {
                method: 'POST' as HTTPMethod,
                headers: { 'Content-Type': 'application/json' },
                body: { address }
            }
        };

        return this.fetch<void>(options);
    }

    /**
     * Make a request to Lavalink
     * @param fetchOptions.endpoint Lavalink endpoint
     * @param fetchOptions.options Options passed to petitio
     * @internal
     */
    private async fetch<T = unknown>(fetchOptions: FetchOptions) {
        const { endpoint, options } = fetchOptions;
        let headers = {
            'Authorization': this.auth,
            'User-Agent': this.node.manager.options.userAgent
        };

        if (options.headers) headers = { ...headers, ...options.headers };

        const url = new URL(`${this.url}${endpoint}`);
        if (options.params) url.search = new URLSearchParams(options.params).toString();

        const request = await Petitio(url.toString())
            .method(options.method?.toUpperCase() as HTTPMethod || 'GET')
            .header(headers)
            .body(options.body ?? {})
            .timeout(this.node.manager.options.restTimeout || 15000)
            .send();

        if (request.statusCode && (request.statusCode >= 400))
            throw new Error(`Rest request failed with response code: ${request.statusCode}`);

        const body = request.body.toString('utf8');
        if (!body?.length) return null;

        return JSON.parse(body) as T;
    }
}
