import { Node } from './Node';
import { NodeOption } from '../Shoukaku';
import Petitio from 'petitio';

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
    loadType: string;
    playlistInfo: {
        name?: string;
        selectedTrack: number;
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

export class Rest {
    private readonly node: Node;
    private readonly url: string;
    private readonly auth: string;
    constructor(node: Node, options: NodeOption) {
        this.node = node;
        this.url = `${options.secure ? 'https' : 'http'}://${options.url}`;
        this.auth = options.auth;
    }

    public resolve(identifier: string): Promise<LavalinkResponse|void> {
        const options = {
            endpoint: '/loadtracks',
            options: { params: { identifier }}
        };
        return this.fetch(options);
    }

    public decode(track: string): Promise<Track|void> {
        const options = {
            endpoint: '/decodetrack',
            options: { params: { track }}
        };
        return this.fetch(options);
    }

    public getRoutePlannerStatus(): Promise<RoutePlanner|void> {
        const options = {
            endpoint: '/routeplanner/status',
            options: {}
        };
        return this.fetch(options);
    }

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

    private async fetch({ endpoint, options }: FetchOptions): Promise<any|void> {
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
        if (request.statusCode && (request.statusCode >= 200 && request.statusCode < 300))
            throw new Error(`Rest request failed with response code: ${request.statusCode}`);
        const body = request.body.toString('utf8');
        if (!body?.length) return;
        return JSON.parse(body);
    }
}
