import { IncomingMessage } from 'http';
import Websocket from 'ws';
import { OpCodes, ShoukakuClientInfo, State, Versions } from '../Constants';
import type {
	PlayerUpdate,
	TrackEndEvent,
	TrackExceptionEvent,
	TrackStartEvent,
	TrackStuckEvent,
	WebSocketClosedEvent
} from '../guild/Player';
import type { NodeOption, Shoukaku, ShoukakuEvents } from '../Shoukaku';
import { TypedEventEmitter, wait } from '../Utils';
import { Rest } from './Rest';

// ... (Keep existing interfaces: Ready, NodeMemory, NodeFrameStats, NodeCpu, Stats, NodeInfoVersion, NodeInfoGit, NodeInfoPlugin, NodeInfo, ResumableHeaders, NonResumableHeaders, NodeEvents) ...
// Note: For brevity in this response block, assume the standard interfaces above remain identical to the original file.

export class Node extends TypedEventEmitter<NodeEvents> {
	public readonly manager: Shoukaku;
	public readonly rest: Rest;
	public readonly name: string;
	public readonly group?: string;
	public readonly region?: string; // ADDED THIS LINE
	private readonly url: string;
	private readonly auth: string;
	public state: State;
	public reconnects: number;
	public stats: Stats | null;
	public info: NodeInfo | null;
	public ws: Websocket | null;
	public sessionId: string | null;

	constructor(manager: Shoukaku, options: NodeOption) {
		super();
		this.manager = manager;
		this.rest = new (this.manager.options.structures.rest ?? Rest)(this, options);
		this.name = options.name;
		this.group = options.group;
		this.region = options.region; // ADDED THIS LINE
		this.auth = options.auth;
		this.url = `${options.secure ? 'wss' : 'ws'}://${options.url}/v${Versions.WEBSOCKET_VERSION}/websocket`;
		this.state = State.DISCONNECTED;
		this.reconnects = 0;
		this.stats = null;
		this.info = null;
		this.ws = null;
		this.sessionId = null;
	}

	get penalties(): number {
		let penalties = 0;
		if (!this.stats) return penalties;

		penalties += this.stats.players;
		penalties += Math.round(Math.pow(1.05, 100 * this.stats.cpu.systemLoad) * 10 - 10);

		if (this.stats.frameStats) {
			penalties += this.stats.frameStats.deficit;
			penalties += this.stats.frameStats.nulled * 2;
		}

		return penalties;
	}

    // ... The rest of the Node.ts class methods (connect, disconnect, message, etc.) remain exactly the same as the original. Keep them untouched!
}
