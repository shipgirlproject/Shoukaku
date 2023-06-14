export type Constructor<T> = new (...args: any[]) => T;
/**
 * https://stackoverflow.com/questions/39494689/is-it-possible-to-restrict-number-to-a-certain-range
 */
export type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc['length']]>

export type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>

/**
 * Merge the default options to user input
 * @param def Default options
 * @param given User input
 * @returns Merged options
 */
export function mergeDefault<T extends { [key: string]: any }>(def: T, given: T): Required<T> {
    if (!given) return def as Required<T>;
    const defaultKeys: (keyof T)[] = Object.keys(def);
    for (const key in given) {
        if (defaultKeys.includes(key)) continue;
        delete given[key];
    }
    for (const key of defaultKeys) {
        if (def[key] === null || (typeof def[key] === 'string' && def[key].length === 0)) {
            if (!given[key]) throw new Error(`${String(key)} was not found from the given options.`);
        }
        if (given[key] === null || given[key] === undefined) given[key] = def[key];
    }
    return given as Required<T>;
}

/**
 * Wait for a specific amount of time (timeout)
 * @param ms Time to wait in milliseconds
 * @returns A promise that resolves in x seconds
 */
export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
