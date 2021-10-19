import { Base64String } from '..';

export class ShoukakuTrack {
    track: Base64String;
    info: {
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
