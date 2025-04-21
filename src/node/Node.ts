import Websocket from 'ws';
import { ShoukakuClientInfo, Versions } from '../Constants';
import { ConnectionState, Events } from '../model/Library';
import { LavalinkOpCodes } from '../model/Node';
import type { NodeInfo, Ready, Stats } from '../model/Node';
import type {
	PlayerUpdate,
	TrackEndEvent,
	TrackExceptionEvent,
	TrackStartEvent,
	TrackStuckEvent,
	WebSocketClosedEvent
} from '../model/Player';
import type { NodeOption, Shoukaku } from '../Shoukaku';
import { wait } from '../Utils';
import { Rest } from './Rest';

export interface ResumableHeaders {
	[key: string]: string;
	'Client-Name': string;
	'User-Agent': string;
	'Authorization': string;
	'User-Id': string;
	'Session-Id': string;
}

export type NonResumableHeaders = Omit<ResumableHeaders, 'Session-Id'>;

/**
 * Represents a Lavalink node
 */
export class Node {
	/**
     * Shoukaku class
     */
	public readonly manager: Shoukaku;
	/**
     * Lavalink rest API
     */
	public readonly rest: Rest;
	/**
     * Name of this node
     */
	public readonly name: string;
	/**
     * Group in which this node is contained
     */
	public readonly group?: string;
	/**
     * URL of Lavalink
     */
	private readonly url: string;
	/**
     * Credentials to access Lavalink
     */
	private readonly auth: string;
	/**
     * The state of this connection
     */
	public state: ConnectionState;
	/**
	 * The number of reconnects to Lavalink
	 */
	public reconnects: number;
	/**
     * Statistics from Lavalink
     */
	public stats: Stats | null;
	/**
     * Information about lavalink node
    */
	public info: NodeInfo | null;
	/**
     * SessionId of this Lavalink connection (not to be confused with Discord SessionId)
     */
	public sessionId: string | null;
	/**
	 * Websocket instance
	 */
	private ws: Websocket | null;

	/**
     * @param manager Shoukaku instance
     * @param options Options on creating this node
     * @param options.name Name of this node
     * @param options.url URL of Lavalink
     * @param options.auth Credentials to access Lavalnk
     * @param options.secure Whether to use secure protocols or not
     * @param options.group Group of this node
     */
	constructor(manager: Shoukaku, options: NodeOption) {
		this.manager = manager;
		this.rest = new (this.manager.options.structures.rest ?? Rest)(this, options);
		this.name = options.name;
		this.group = options.group;
		this.auth = options.auth;
		this.url = `${options.secure ? 'wss' : 'ws'}://${options.url}/v${Versions.WEBSOCKET_VERSION}/websocket`;
		this.state = ConnectionState.Disconnected;
		this.reconnects = 0;
		this.stats = null;
		this.info = null;
		this.sessionId = null;
		this.ws = null;
	}

	/**
     * Penalties for load balancing
     * @returns Penalty score
     * @internal @readonly
     */
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

	/**
     * Connect to Lavalink
     */
	public async connect(): Promise<void>{
		if (!this.manager.id) throw new Error('UserId missing, probably your connector is misconfigured?');

		if (this.state !== ConnectionState.Disconnected) return;

		this.state = ConnectionState.Connecting;

		const headers: NonResumableHeaders | ResumableHeaders = {
			'Client-Name': ShoukakuClientInfo,
			'User-Agent': this.manager.options.userAgent,
			'Authorization': this.auth,
			'User-Id': this.manager.id
		};

		if (this.sessionId) {
			headers['Session-Id'] = this.sessionId;

			this.manager.emit(Events.Debug, `[Socket] -> [${this.name}] : Session-Id is present, attempting to resume`);
		}

		this.manager.emit(Events.Debug, `[Socket] -> [${this.name}] : Connecting to ${this.url} ...`);

		const create_connection = () => {
			const url = new URL(this.url);

			const server = new Websocket(url.toString(), { headers } as Websocket.ClientOptions);

			const cleanup = () => {
				server.onopen = null;
				server.onclose = null;
				server.onerror = null;
			};

			return new Promise<Websocket>((resolve, reject) => {
				server.onopen = () => {
					cleanup();
					resolve(server);
				};
				server.onclose = () => {
					cleanup();
					reject(new Error('Websocket closed before a connection was established'));
				};
				server.onerror = (error) => {
					cleanup();
					reject(new Error(`Websocket failed to connect due to: ${error.message}`));
				};
			});
		};

		let error: Error;

		for (; this.reconnects < this.manager.options.reconnectTries; this.reconnects++) {
			try {
				this.ws = await create_connection();
			} catch (err) {
				this.manager.emit(Events.Debug, `[Socket] -> [${this.name}] : Reconnecting in ${this.manager.options.reconnectInterval} seconds. ${this.manager.options.reconnectTries - this.reconnects} tries left`);
				await wait(this.manager.options.reconnectInterval * 1000);
				error = err as Error;
			}
		}

		this.reconnects = 0;

		if (error!) {
			this.state = ConnectionState.Disconnected;
			throw error;
		}

		this.ws!.once('close', (...args) => void this.close(...args).catch(error => this.error(error as Error)));
		this.ws!.on('message', data => void this.message(data).catch(error => this.error(error as Error)));
		this.ws!.on('error', error => this.error(error));
	}

	/**
     * Disconnect from Lavalink
     * @param code Status code
     * @param reason Reason for disconnect
     */
	public destroy(code: number, reason?: string): void {
		void this.close(1000, Buffer.from(reason ?? 'Unknown Reason', 'utf-8'), true);
	}

	/**
     * Handle message from Lavalink
     * @param message JSON message
     * @internal
     */
	private async message(message: unknown): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const json: Ready | Stats | PlayerUpdate | TrackStartEvent | TrackEndEvent | TrackStuckEvent | TrackExceptionEvent | WebSocketClosedEvent = JSON.parse(message as string);

		if (!json) return;

		switch (json.op) {
			case LavalinkOpCodes.Stats:
				this.manager.emit(Events.Debug, `[Socket] <- [${this.name}] : Node Status Update | Server Load: ${this.penalties}`);
				this.stats = json;
				break;
			case LavalinkOpCodes.Ready: {
				this.state = ConnectionState.Connected;

				if (!json.sessionId) {

					this.manager.emit(Events.Debug, `[Socket] -> [${this.name}] : No session id found from ready op? disconnecting and reconnecting to avoid issues`);

					return this.ws!.close(1000, 'No session-id found upon firing ready event');
				}

				this.sessionId = json.sessionId;

				this.manager.emit(Events.Debug, `[Socket] -> [${this.name}] : Lavalink is ready to communicate !`);

				this.manager.emit(Events.Ready, this, json.resumed);

				if (this.manager.options.resume) {
					await this.rest.updateSession(this.manager.options.resume, this.manager.options.resumeTimeout);

					this.manager.emit(Events.Debug, `[Socket] -> [${this.name}] : Resuming configured for this Session Id: ${this.sessionId}`);
				}

				break;
			}
			case LavalinkOpCodes.Event: {
				this.manager.emit(Events.PlayerEvent, this, json);
				break;
			}
			case LavalinkOpCodes.PlayerUpdate: {
				this.manager.emit(Events.PlayerUpdate, this, json);
				break;
			}
			default:
				this.manager.emit(Events.Debug, `[Player] -> [Node] : Unknown Message Op, Data => ${JSON.stringify(json)}`);
		}
	}

	/**
     * Handle closed event from lavalink
     * @param code Status close
     * @param reason Reason for connection close
	 * @param destroy If we should not try to connect again
     */
	private async close(code: number, reason: Buffer, destroy = false): Promise<void> {
		if (this.state === ConnectionState.Disconnected) return;

		this.state = ConnectionState.Disconnecting;

		this.manager.emit(Events.Debug, `[Socket] <-/-> [${this.name}] : Connection Closed, Code: ${code || 'Unknown Code'}`);

		this.manager.emit(Events.Close, this,code, String(reason));

		this.ws?.removeAllListeners();
		this.ws?.terminate();
		this.ws = null;

		if (!this.manager.options.resume) {
			this.sessionId = null;
		}

		this.state = ConnectionState.Disconnected;

		if (destroy) {
			return void this.manager.emit(Events.Disconnect, this);
		}

		try {
			await this.connect();
		} catch (error) {
			this.error(error as Error);
			this.manager.emit(Events.Disconnect, this);
		}
	}

	/**
     * To emit error events easily
     * @param error error message
     */
	public error(error: Error): void {
		this.manager.emit(Events.Error, this, error);
	}
}
