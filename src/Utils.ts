import { EventEmitter } from "node:events";
import { setTimeout } from "node:timers";

// https://stackoverflow.com/a/67244127
export abstract class TypedEventEmitter<TEvents extends Record<string, unknown[]>> extends EventEmitter {
	public constructor() {
		super();
	}

	public override on<TEvent extends Extract<keyof TEvents, string> | symbol>(
		eventName: TEvent,
		listener: (...args: TEvents[Extract<TEvent, string>]) => void,
	): this {
		return super.on(eventName, listener);
	}

	public override once<TEvent extends Extract<keyof TEvents, string> | symbol>(
		eventName: TEvent,
		listener: (...args: TEvents[Extract<TEvent, string>]) => void,
	): this {
		return super.once(eventName, listener);
	}

	public override off<TEvent extends Extract<keyof TEvents, string> | symbol>(
		eventName: TEvent,
		listener: (...args: TEvents[Extract<TEvent, string>]) => void,
	): this {
		return super.off(eventName, listener);
	}

	public override emit<TEvent extends Extract<keyof TEvents, string> | symbol>(
		eventName: TEvent,
		...args: TEvents[Extract<TEvent, string>]
	): boolean {
		return super.emit(eventName, ...args);
	}
}

export type Constructor<TInstance> = new (...args: unknown[]) => TInstance;

/**
 * Merge the default options to user input
 *
 * @param def - Default options
 * @param given - User input
 * @returns Merged options
 */

export function mergeDefault<TOptions extends Record<string, any>>(def: TOptions, given: TOptions): Required<TOptions> {
	if (!given) {
		return def as Required<TOptions>;
	}

	const defaultKeys: (keyof TOptions)[] = Object.keys(def);
	const filtered: TOptions = {} as TOptions;

	for (const key of defaultKeys) {
		if (key in given) {
			filtered[key] = given[key];
		}
	}

	for (const key of defaultKeys) {
		if ((def[key] === null || (typeof def[key] === "string" && def[key].length === 0)) && !filtered[key]) {
			throw new Error(`${String(key)} was not found from the given options.`);
		}

		filtered[key] ??= def[key];
	}

	return filtered as Required<TOptions>;
}

/**
 * Wait for a specific amount of time (timeout)
 *
 * @param ms - Time to wait in milliseconds
 * @returns A promise that resolves in x seconds
 */
export async function wait(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
