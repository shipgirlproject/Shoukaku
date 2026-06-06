import { NodeDefaults } from "../Constants.js";
import type { NodeOption, Shoukaku } from "../Shoukaku.js";
import { mergeDefault } from "../Utils.js";
import type { ServerUpdate, StateUpdatePartial } from "../guild/Connection.js";

export interface ConnectorMethods {
	getId: any;
	sendPacket: any;
}

export const AllowedPackets = ["VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE"];

export abstract class Connector {
	protected readonly client: any;

	protected manager: Shoukaku | null;

	public constructor(client: any) {
		this.client = client;
		this.manager = null;
	}

	public set(manager: Shoukaku): this {
		this.manager = manager;
		return this;
	}

	protected ready(nodes: NodeOption[]): void {
		this.manager!.id = this.getId();
		for (const node of nodes) {
			this.manager!.addNode(mergeDefault(NodeDefaults, node));
		}
	}

	protected raw(packet: any): void {
		if (!AllowedPackets.includes(packet.t as string)) {
			return;
		}

		const guildId = packet.d.guild_id as string;
		const connection = this.manager!.connections.get(guildId);
		if (!connection) {
			return;
		}

		if (packet.t === "VOICE_SERVER_UPDATE") {
			connection.setServerUpdate(packet.d as ServerUpdate);
			return;
		}

		const userId = packet.d.user_id as string;
		if (userId !== this.manager!.id) {
			return;
		}

		connection.setStateUpdate(packet.d as StateUpdatePartial);
	}

	public abstract getId(): string;

	public abstract sendPacket(shardId: number, payload: unknown, important: boolean): void;

	public abstract listen(nodes: NodeOption[]): void;
}
