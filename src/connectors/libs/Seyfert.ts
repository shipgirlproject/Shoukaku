/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { Connector } from '../Connector';
import { NodeOption } from '../../Shoukaku';

export class Seyfert extends Connector {
	// sendPacket is where your library send packets to Discord Gateway
	public sendPacket(shardId: number, payload: unknown, important: boolean): void {
		return this.client.gateway.send(shardId, payload);
	}
	// getId is a getter where the lib stores the client user (the one logged in as a bot) id
	public getId(): string {
		return this.client.botId;
	}
	// Listen attaches the event listener to the library you are using
	public listen(nodes: NodeOption[]): void {
		this.client.events.values.RAW = {
			data: { name: 'raw' },
			run: (packet: any) => {
				// Only attach to ready event once, refer to your library for its ready event
				if (packet.t === 'READY') return this.ready(nodes);
				// Attach to the raw websocket event, this event must be 1:1 on spec with dapi (most libs implement this)
				return this.raw(packet);
			}
		};
	}
}
