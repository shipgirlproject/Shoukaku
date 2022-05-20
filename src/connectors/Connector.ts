import { NodeOption, Shoukaku } from '../Shoukaku';
import { ShoukakuDefaults } from '../Constants';
import { mergeDefault } from '../Utils';

export interface ConnectorMethods {
    sendPacket: any;
    getId: any;
}

export abstract class Connector {
    protected readonly manager: Shoukaku;
    protected readonly client: any;
    constructor(manager: Shoukaku, client: any) {
        this.manager = manager;
        this.client = client;
    }

    protected ready(nodes: NodeOption[]): void {
        this.manager.id = this.getId();
        this.manager.emit('debug', 'Manager', `[Manager] : Connecting ${nodes.length} nodes`);
        for (const node of nodes) this.manager.addNode(mergeDefault(ShoukakuDefaults, node));
    }
    
    protected raw(packet: any): void {
        if (!['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(packet.t)) return;
        // for (const node of this.manager.nodes.values()) node.clientRaw(packet);
    }

    abstract getId(): string;

    abstract sendPacket(shardId: number, payload: any, important: boolean): void;

    abstract listen(nodes: NodeOption[]): void;
}