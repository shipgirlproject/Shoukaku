import { ShoukakuTrackList } from '../Constants';

export class ShoukakuRest {
    constructor (
        node: { url: string, auth: string, secure: boolean },
        options: { userAgent: string, timeout: number }
    )

    public url: string;
    public timeout: number;
    private auth: string;
    private userAgent: string;

    private get router(): number;
    public async resolve(identifier: string, search: string | null): Promise<void | ShoukakuTrackList>;
    public decode(track: string): Promise<Object>;
    public getRoutePlannerStatus(): Promise<Object>;
    public unmarkFailedAddress(address: string): Promise<void>;
    public unmarkAllFailedAddress(): Promise<void>;
    protected async fetch(url: string, options?: { method: string, options?: Object }): Object;
}
