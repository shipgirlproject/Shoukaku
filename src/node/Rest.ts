import { Node } from './Node';
import { NodeOption } from '../Shoukaku';
import Petitio from 'petitio';

export type LoadType = 'TRACK_LOADED' | 'PLAYLIST_LOADED' | 'SEARCH_RESULT' | 'NO_MATCHES' | 'LOAD_FAILED';

interface FetchOptions {
    endpoint: string;
    options: any;
}

export interface Track {
    track: string;
    info: {
        identifier: string;
        isSeekable: boolean;
        author: string;
        length: number;
        isStream: boolean;
        position: boolean;
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
 * @internal
 */
export class Rest {
    /**
     * Node that initialized this instance
     * @readonly
     */
    private readonly node: Node;
    /**
     * URL of Lavalink
     */
    private readonly url: string;
    /**
     * Credentials to access Lavalink
     */
    private readonly auth: string;
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
     * @internal
     */
    public resolve(identifier: string): Promise<LavalinkResponse|void> {
        const options = {
            endpoint: '/loadtracks',
            options: { params: { identifier }}
        };
        return this.fetch(options);
    }

    /**
     * Decode a track
     * @param track Encoded track
     * @returns Promise that resolves to a track or void
     * @internal
     */
    public decode(track: string): Promise<Track|void> {
        const options = {
            endpoint: '/decodetrack',
            options: { params: { track }}
        };
        return this.fetch(options);
    }

    /**
     * Get routplanner status from Lavalink
     * @returns Promise that resolves to a routeplanner response or void
     * @internal
     */
    public getRoutePlannerStatus(): Promise<RoutePlanner|void> {
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
    public unmarkFailedAddress(address: string): Promise<void> {
        const options = {
            endpoint: '/routeplanner/free/address',
            options: {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: { address }
            }
        };
        return this.fetch(options);
    }

    /**
     * Make a request to Lavalink
     * @param fetchOptions.endpoint Lavalink endpoint
     * @param fetchOptions.options Options passed to petitio
     */
    private async fetch(fetchOptions: FetchOptions): Promise<any|void> {
        const { endpoint, options } = fetchOptions;
        let headers: Record<string, any> = {
            'Authorization': this.auth,
            'User-Agent': this.node.manager.options.userAgent
        };
        if (options.headers) headers = { ...headers, ...options.headers };
        const url = new URL(`${this.url}${endpoint}`);
        if (options.params) url.search = new URLSearchParams(options.params).toString();
        const request = await Petitio(url.toString())
            .method(options.method?.toUpperCase() || 'GET')
            .header(headers)
            .body(options.body ?? null)
            .timeout(this.node.manager.options.restTimeout || 15000)
            .send();
        if (request.statusCode && (request.statusCode >= 400))
            throw new Error(`Rest request failed with response code: ${request.statusCode}`);
        const body = request.body.toString('utf8');
        if (!body?.length) return;
        return JSON.parse(body);
    }
}
