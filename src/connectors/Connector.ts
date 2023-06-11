import { NodeOption, Shoukaku } from '../Shoukaku';
import { NodeDefaults } from '../Constants';
import { mergeDefault } from '../Utils';

export interface ConnectorMethods {
    sendPacket: any;
    getId: any;
}

export const AllowedPackets = [ 'VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE' ];

export abstract class Connector {
    protected readonly client: any;
    protected manager: Shoukaku | null;
    constructor(client: any) {
        this.client = client;
        this.manager = null;
    }

    public set(manager: Shoukaku): Connector {
        this.manager = manager;
        return this;
    }

    protected ready(nodes: NodeOption[]): void {
        this.manager!.id = this.getId();
        for (const node of nodes) this.manager!.addNode(mergeDefault(NodeDefaults, node));
    }

    protected raw(packet: any): void {
        if (!AllowedPackets.includes(packet.t)) return;

        for (const node of this.manager!.nodes.values()) {
            if (node.players.has(packet.d.guild_id)) {
                node.discordRaw(packet);
                break;
            }
        }
    }

    abstract getId(): string;

    abstract sendPacket(shardId: number, payload: any, important: boolean): void;

    abstract listen(nodes: NodeOption[]): void;
}
