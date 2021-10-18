import { SearchTypes } from "./Constants";

export class Utils {
    public static getVersion(): { variant: 'light' | 'vanilla', version: string } | never;
    public static mergeDefault(def: Object, given: Object): Object;
    public static searchType(string: string): SearchTypes.soundcloud | SearchTypes.youtube | SearchTypes.youtubemusic;
    public static wait(ms: number): Promise<void>;
}
