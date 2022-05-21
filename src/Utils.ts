export function mergeDefault(def: any, given: any): any {
    if (!given) return def;
    const defaultKeys = Object.keys(def);
    for (const key of defaultKeys) {
        if (def[key] === null) {
            if (!given[key]) throw new Error(`${key} was not found from the given options.`);
        }
        if (given[key] === null || given[key] === undefined) given[key] = def[key];
    }
    for (const key in defaultKeys) {
        if (defaultKeys.includes(key)) continue;
        delete given[key];
    }
    return given;
}

export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
