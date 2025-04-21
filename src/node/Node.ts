import Websocket from 'ws';
import { ShoukakuClientInfo, Versions } from '../Constants';
import type { Connection } from '../guild/Connection';
import { ConnectionState, Events } from '../model/Library';
import type { NodeInfo, Ready, Stats } from '../model/Node';
import { LavalinkOpCodes } from '../model/Node';
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
	 * @readonly
     */
	public state: ConnectionState;
	/**
	 * The number of reconnects to Lavalink
	 * @readonly
	 */
	public reconnects: number;
	/**
     * Statistics from Lavalink
	 * @readonly
     */
	public stats: Stats | null;
	/**
     * Information about lavalink node
	 * @readonly
    */
	public info: NodeInfo | null;
	/**
     * SessionId of this Lavalink connection (not to be confused with Discord SessionId)
	 * @readonly
     */
	public sessionId: string | null;
	/**
	 * Connections that are referenced by this node
	 * @internal
	 */
	public connections: WeakSet<Connection>;
	/**
	 * Websocket instance
	 * @private
	 */
	#ws: Websocket | null;
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
		this.connections = new WeakSet();
		this.#ws = null;
	}

	/**
     * Penalties for load balancing
     * @returns Penalty score
     * @readonly
     */
	public get penalties(): number {
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
	 * Node connections, this exists because weaksets can't be iterated on
	 * @returns An array of connections being referenced by this node
	 * @readonly
	 * @internal
	 */
	public get mappedConnections(): Connection[] {
		return this.manager.connections.filter(connection => this.connections.has(connection));
	}

	/**
     * Connect to Lavalink
	 * @internal
     */
	public async connect(): Promise<void>{
		if (this.state !== ConnectionState.Disconnected) return;

		this.state = ConnectionState.Connecting;

		const headers: NonResumableHeaders | ResumableHeaders = {
			'Client-Name': ShoukakuClientInfo,
			'User-Agent': this.manager.options.userAgent,
			'Authorization': this.auth,
			'User-Id': this.manager.userId
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
				this.#ws = await create_connection();
			} catch (err) {
				this.manager.emit(Events.Debug, `[Socket] -> [${this.name}] : Reconnecting in ${this.manager.options.reconnectInterval} seconds. ${this.manager.options.reconnectTries - this.reconnects} tries left`);
				await wait(this.manager.options.reconnectInterval * 1000);
				error = err as Error;
			}
		}

		this.reconnects = 0;

		if (error!) {
			this.state = ConnectionState.Disconnected;

			await this.handleOnDisconnect();

			throw error;
		}

		this.#ws!.once('close', (...args) => void this.close(...args).catch(error => this.error(error as Error)));
		this.#ws!.on('message', data => void this.message(data).catch(error => this.error(error as Error)));
		this.#ws!.on('error', error => this.error(error));
	}

	/**
     * Disconnect from Lavalink
     * @param code Status code
     * @param reason Reason for disconnect
	 * @internal
     */
	public destroy(code: number, reason?: string): void {
		void this.close(code, Buffer.from(reason ?? 'Unknown Reason', 'utf-8'), true);
	}

	/**
     * Handle message from Lavalink
     * @param message JSON message
	 * @private
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

					return this.close(1000, Buffer.from('No session-id found upon firing ready event', 'utf-8'), false);
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
	 * @private
	 * @internal
     */
	private async close(code: number, reason: Buffer, destroy = false): Promise<void> {
		if (this.state === ConnectionState.Disconnected) return;

		this.state = ConnectionState.Disconnecting;

		this.manager.emit(Events.Debug, `[Socket] <-/-> [${this.name}] : Connection Closed, Code: ${code || 'Unknown Code'}`);

		this.manager.emit(Events.Close, this,code, String(reason));

		this.#ws?.removeAllListeners();
		this.#ws?.terminate();
		this.#ws = null;

		if (!this.manager.options.resume) {
			this.sessionId = null;
		}

		this.state = ConnectionState.Disconnected;

		if (destroy) {
			await this.handleOnDisconnect();
			return void this.manager.emit(Events.Disconnect, this);
		}

		await this.connect();
	}

	/**
	 * @private
	 * @internal
	 */
	private async handleOnDisconnect(): Promise<void> {
		const connections = this.mappedConnections.map(async connection => {
			this.connections.delete(connection);

			if (!this.manager.options.moveOnDisconnect) return;

			const node = this.manager.getIdealNode(connection);

			if (!node || !connection.serverUpdate || !connection.sessionId) {
				return void connection.disconnect();
			}

			try {
				await node.rest.updatePlayer(connection.guildId, {
					voice: {
						sessionId: connection.sessionId,
						endpoint: connection.serverUpdate.endpoint,
						token: connection.serverUpdate.token
					}
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (_) {
				return void connection.disconnect();
			}
		});

		await Promise.allSettled(connections);
	}

	/**
     * To emit error events easily
     * @param error error message
	 * @private
	 * @internal
     */
	private error(error: Error): void {
		this.manager.emit(Events.Error, this, error);
	}
}
