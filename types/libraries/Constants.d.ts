export interface GetterObj {
    guilds: Map<any, any>,
    id: () => number,
    ws: (shardID: number, payload: string, important: boolean) => any
}
