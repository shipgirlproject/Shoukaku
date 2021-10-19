import { DecodedTrack, LavalinkSource } from '..';
import { ShoukakuTrackList } from '../struct/ShoukakuTrackList';

export class ShoukakuRest {
    constructor(node: { url: string, auth: string, secure: boolean }, options: { userAgent: string, timeout: number });

    public url: string;
    public timeout: number;
    public resolve(identifier: string, search?: LavalinkSource): Promise<ShoukakuTrackList>;
    public decode(track: string): Promise<DecodedTrack>;
    public getRoutePlannerStatus(): Promise<Object>;
    public unmarkFailedAddress(address: string): Promise<void>;
    public unmarkAllFailedAddress(): Promise<void>;
    protected fetch(url: string, options?: { method: string, options?: Object }): Promise<Object>;
    private auth: string;
    private userAgent: string;
    private get router(): number;
}