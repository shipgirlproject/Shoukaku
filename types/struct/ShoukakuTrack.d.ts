import { Base64String } from '..';

export class ShoukakuTrack {
    constructor(raw: object);
    public track: Base64String;
    public info: {
        identifier?: string;
        isSeekable?: boolean;
        author?: string;
        length?: number;
        isStream?: boolean;
        position?: number;
        title?: string;
        uri?: string;
    };
}
