import { ShoukakuTrack } from './ShoukakuTrack';

export class ShoukakuTrackList {
    type: 'PLAYLIST' | 'TRACK' | 'SEARCH' | 'NO_MATCHES' | 'LOAD_FAILED';
    selectedTrack: number;
    playlistName?: string;
    tracks: ShoukakuTrack[];
}