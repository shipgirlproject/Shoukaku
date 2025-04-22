/* eslint-disable @typescript-eslint/unbound-method           */
/* eslint-disable @typescript-eslint/no-unsafe-member-access  */
/* eslint-disable @typescript-eslint/no-explicit-any          */
/* eslint-disable @typescript-eslint/no-unsafe-call           */
/* eslint-disable @typescript-eslint/no-unsafe-return         */

import type { ServerUpdate, StateUpdatePartial } from '../guild/Connection';
import type { Shoukaku } from '../Shoukaku';

export interface ConnectorOptions {
	client: unknown;
	sendPacket: (client: unknown, shardId: number, payload: unknown) => void;
	listenEvent: (client: unknown, handler: (packet: any) => void) => void;
}

export const AllowedPackets = [ 'VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE' ];

/**
 * Wrapper class around shoukaku to Discord websocket communication
 */
export class Connector {
	protected readonly manager: Shoukaku;
	protected readonly options: ConnectorOptions;
	constructor(manager: Shoukaku, options: ConnectorOptions) {
		this.manager = manager;
		this.options = options;
		this.options.listenEvent(options.client, this.handleRaw.bind(this));
	}

	private handleRaw(packet: any): void {
		if (!AllowedPackets.includes(packet.t as string)) return;

		const guildId = packet.d.guild_id as string;
		const connection = this.manager.connections.find(conn => conn.guildId === guildId);

		if (!connection) return;

		if (packet.t === 'VOICE_SERVER_UPDATE') return connection.setServerUpdate(packet.d as ServerUpdate);

		const userId = packet.d.user_id as string;

		if (userId !== this.manager.userId) return;

		connection.setStateUpdate(packet.d as StateUpdatePartial);
	}

	public sendPacket(shardId: number, payload: unknown) {
		return this.options.sendPacket(this.options.client, shardId, payload);
	}
}

/**
 * @param client Discord.JS client
 * Creates a DiscordJS Connector option
 */
export function createDiscordJSOptions(client: unknown): ConnectorOptions {
	return {
		client,
		sendPacket: (client: any, shardId: number, payload: unknown) => {
			return client.ws.shards.get(shardId)?.send(payload, false);
		},
		listenEvent: (client: any, handler) => {
			return void client.on('raw', handler);
		}
	};
}

/**
 * @param client Eris client
 * Creates an Eris Connector option
 */
export function createErisOptions(client: unknown): ConnectorOptions {
	return {
		client,
		sendPacket: (client: any, shardId: number, payload: any) => {
			return client.shards.get(shardId)?.sendWS(payload.op, payload.d, false);
		},
		listenEvent: (client: any, handler) => {
			return void client.on('rawWS', handler);
		}
	};
}

/**
 * @param client OceanicJS client
 * Creates a OceanicJS Connector option
 */
export function createOceanicOptions(client: unknown): ConnectorOptions {
	return {
		client,
		sendPacket: (client: any, shardId: number, payload: any) => {
			return client.shards.get(shardId)?.send(payload.op, payload.d, false);
		},
		listenEvent: (client: any, handler) => {
			return void client.on('packet', handler);
		}
	};
}

/**
 * @param client Seyfert client
 * Creates a Seyfert Connector option
 */
export function createSeyfertOptions(client: unknown): ConnectorOptions {
	return {
		client,
		sendPacket: (client: any, shardId: number, payload: any) => {
			return client.gateway.send(shardId, payload);
		},
		listenEvent: (client: any, handler) => {
			client.events.values.RAW = {
				data: { name: 'raw' },
				run: handler
			};
		}
	};
}
