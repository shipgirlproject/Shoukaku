import { EventEmitter } from 'node:events';
import { satisfies, validateStrict } from 'compare-versions';
import type { NodeInfoPlugin } from './node/Node';

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

// https://stackoverflow.com/a/73753173
export type HintedString<KnownValues extends string> = (string & {}) | KnownValues;

/**
 * Utility for specifying types in generic interfaces, workaround for TypeScript types not existing at runtime
 * @typeParam T Type
 */
export const t = <T>(type: unknown) => type as T;

export interface PluginRequirement{
	/**
	 * Name of plugin required
	 */
	readonly name: string;
	/**
	 * Version of plugin required, any string or npm style semver range
	 * @see https://semver.npmjs.com/#syntax-examples
	 */
	readonly version: string;
}

export class PluginError extends Error {
	constructor(
		readonly requiredFor: string,
		readonly required: PluginRequirement,
		readonly found?: NodeInfoPlugin
	) {
		super(`Plugin ${required.name}@${required.version} is required for ${requiredFor}, but ${found ? `found ${found.name}@${found.version}` : 'was not found'}`);
		this.name = 'PluginError';
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

/**
 * Validate if plugins present in node meets specified plugin requirements
 * @param requiredFor specifies what requires the plugin
 * @param required plugin requirements
 * @param nodePlugins plugins present in node
 * @throws {@link PluginError} when plugin is not found or does not satisfy version
 * @internal
 */
export function validatePluginRequirement(requiredFor: string, required: PluginRequirement, nodePlugins?: NodeInfoPlugin[]) {
	const found = nodePlugins?.find((p => p.name === required.name));

	const isValid = !!found
	    && (validateStrict(required.version)
	    	? satisfies(found.version, required.version)
	    	: found?.version === required.version);

	if (!isValid) throw new PluginError(requiredFor, required, found);
}
