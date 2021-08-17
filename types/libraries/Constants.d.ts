export interface GetterObj<K, V, M extends Map<K, V>> {
    guilds: M;
    id: () => number;
    ws: (shardId: number, payload: string, important: boolean) => any;
}
