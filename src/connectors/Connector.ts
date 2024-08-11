/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
import { NodeOption, Shoukaku } from '../Shoukaku';
import { NodeDefaults } from '../Constants';
import { mergeDefault } from '../Utils';
import { ServerUpdate, StateUpdatePartial } from '../guild/Connection';

export interface ConnectorMethods {
	sendPacket: any;
	getId: any;
}

export const AllowedPackets = [ 'VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE' ];

export abstract class Connector {
	protected readonly client: any;
	protected manager: Shoukaku | null;
	constructor(client: any) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
		if (!AllowedPackets.includes(packet.t as string)) return;
		const guildId = packet.d.guild_id as string;
		const connection = this.manager!.connections.get(guildId);
		if (!connection) return;
		if (packet.t === 'VOICE_SERVER_UPDATE') return connection.setServerUpdate(packet.d as ServerUpdate);
		const userId = packet.d.user_id as string;
		if (userId !== this.manager!.id) return;
		connection.setStateUpdate(packet.d as StateUpdatePartial);
	}

	abstract getId(): string;

	abstract sendPacket(shardId: number, payload: unknown, important: boolean): void;

	abstract listen(nodes: NodeOption[]): void;
}
