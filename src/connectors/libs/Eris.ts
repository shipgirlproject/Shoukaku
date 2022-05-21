import { Connector } from '../Connector';
import { NodeOption } from '../../Shoukaku';

export class Eris extends Connector {
    // sendPacket is where your library send packets to Discord Gateway
    public sendPacket(shardId: number, payload: any, important: boolean): void {
        return this.client.shards.get(shardId)?.sendWS(payload.op, payload.d, important);
    }
    // getId is a getter where the lib stores the client user (the one logged in as a bot) id
    public getId(): string {
        return this.client.user.id;
    }
    // Listen attaches the event listener to the library you are using
    public listen(nodes: NodeOption[]): void {
        // Only attach to ready event once, refer to your library for its ready event
        this.client.once('ready', () => this.ready(nodes));
        // Attach to the raw websocket event, this event must be 1:1 on spec with dapi (most libs implement this)
        this.client.on('rawWS', (packet: any) => this.raw(packet));
    }
}
