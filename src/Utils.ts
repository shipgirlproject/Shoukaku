export type Constructor<T> = new (...args: unknown[]) => T;

export type OmitNested<I extends object, K extends keyof I, T extends keyof NonNullable<I[K]>> = {
	[key in keyof I]: key extends K ? Omit<I[key], T> : I[key];
};

/**
 * @see https://github.com/microsoft/TypeScript/issues/43505#issuecomment-1686128430
 */
export type NumericRange<
	start extends number,
	end extends number,
	arr extends unknown[] = [],
	acc extends number = never
> = arr['length'] extends end
	? acc | start | end
	: NumericRange<start, end, [...arr, 1], arr[start] extends undefined ? acc : acc | arr['length']>;

/**
 * Merge the default options to user input
 * @param def Default options
 * @param given User input
 * @returns Merged options
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeDefault<T extends Record<string, any>>(def: T, given: T): Required<T> {
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
