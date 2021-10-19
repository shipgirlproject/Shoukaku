import { ShoukakuTrack } from './ShoukakuTrack';

export class ShoukakuTrackList {
    constructor(raw: object);
    public type: 'PLAYLIST' | 'TRACK' | 'SEARCH' | 'NO_MATCHES' | 'LOAD_FAILED';
    public selectedTrack: number;
    public playlistName?: string;
    public tracks: ShoukakuTrack[];
}