import { EventEmitter } from 'node:events';
// import { Rest } from './node/Rest';

// https://stackoverflow.com/a/67244127
export abstract class TypedEventEmitter<T extends Record<string, unknown[]>> extends EventEmitter {
	protected constructor() {
		super();
	}

	on<K extends Extract<keyof T, string> | symbol>(eventName: K, listener: (...args: T[Extract<K, string>]) => void): this {
		return super.on(eventName, listener);
	}

	once<K extends Extract<keyof T, string> | symbol>(eventName: K, listener: (...args: T[Extract<K, string>]) => void): this {
		return super.once(eventName, listener);
	}

	off<K extends Extract<keyof T, string> | symbol>(eventName: K, listener: (...args: T[Extract<K, string>]) => void): this {
		return super.off(eventName, listener);
	}

	emit<K extends Extract<keyof T, string> | symbol>(eventName: K, ...args: T[Extract<K, string>]): boolean {
		return super.emit(eventName, ...args);
	}
}

export type Constructor<T> = new (...args: unknown[]) => T;

/**
 * Merge the default options to user input
 * @param def Default options
 * @param given User input
 * @returns Merged options
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeDefault<T extends Record<string, any>>(def: T, given: T): Required<T> {
	if (!given) return def as Required<T>;
	const defaultKeys: Array<keyof T> = Object.keys(def);
	for (const key in given) {
		if (defaultKeys.includes(key)) continue;
		delete given[key];
	}
	for (const key of defaultKeys) {
		if (def[key] === null || (typeof def[key] === 'string' && def[key].length === 0)) {
			if (!given[key]) throw new Error(`${String(key)} was not found from the given options.`);
		}
		given[key] ??= def[key];
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Head<T extends any[]> = Required<T> extends [ ...infer R, unknown ] ? R : never;

// type GenericConstructor<T = object> = new (...args: unknown[]) => T;
// type ConstrainedRestBase = GenericConstructor<Rest>;

// export type ExtendRestFns = Record<string, (this: Rest, ...args: unknown[]) => unknown>;

// export function extendRest(extensions: ExtendRestFns) {
// 	return class extends Rest {
// 		constructor(...args: ConstructorParameters<typeof Rest>) {
// 			super(...args);
// 			for (const [ name, func ] of Object.entries(extensions)) {
// 				// @ts-expect-error dynamic assignment
// 				this[name] = func.bind(this);
// 			}
// 		}
// 	};
// }
