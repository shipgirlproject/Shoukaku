import { EventEmitter, once } from 'node:events';
import { Events, ConnectionState, VoiceState } from '../model/Library';
import type { Shoukaku, VoiceChannelOptions } from '../Shoukaku';

/**
 * Represents the partial payload from a stateUpdate event
 */
export interface StateUpdatePartial {
	channel_id?: string;
	session_id?: string;
	self_deaf: boolean;
	self_mute: boolean;
}

/**
 * Represents the payload from a serverUpdate event
 */
export interface ServerUpdate {
	token: string;
	guild_id: string;
	endpoint: string;
}

/**
 * Represents a connection to a Discord voice channel
 */
export class Connection extends EventEmitter {
	/**
	 * The manager where this connection is on
	 */
	public manager: Shoukaku;
	/**
	 * GuildId of the connection that is being managed by this instance
	 */
	public guildId: string;
	/**
	 * VoiceChannelId of the connection that is being managed by this instance
	 */
	public channelId: string | null;
	/**
	 * ShardId where this connection sends data on
	 */
	public shardId: number;
	/**
	 * Mute status in connected voice channel
	 */
	public muted: boolean;
	/**
	 * Deafen status in connected voice channel
	 */
	public deafened: boolean;
	/**
	 * Id of the currently active voice channel connection
	 */
	public sessionId: string | null;
	/**
	 * Region of connected voice channel
	 */
	public region: string | null;
	/**
	 * Cached serverUpdate event from Lavalink
	 */
	public serverUpdate: ServerUpdate | null;
	/**
	 * Connection state
	 */
	public state: ConnectionState;
	/**
	 * @param manager The manager of this connection
	 * @param options The options to pass in connection creation
	 * @param options.guildId GuildId in which voice channel to connect to is located
	 * @param options.shardId ShardId in which the guild exists
	 * @param options.channelId ChannelId of voice channel to connect to
	 * @param options.deaf Optional boolean value to specify whether to deafen the current bot user
	 * @param options.mute Optional boolean value to specify whether to mute the current bot user
	 */
	constructor(manager: Shoukaku, options: VoiceChannelOptions) {
		super();
		this.manager = manager;
		this.guildId = options.guildId;
		this.channelId = options.channelId;
		this.shardId = options.shardId;
		this.muted = options.mute ?? false;
		this.deafened = options.deaf ?? false;
		this.sessionId = null;
		this.region = null;
		this.serverUpdate = null;
		this.state = ConnectionState.Disconnected;
	}

	/**
	 * Set the deafen status for the current bot user
	 * @param deaf Boolean value to indicate whether to deafen or un-deafen
	 * @defaultValue false
	 */
	public setDeaf(deaf = false): void {
		this.deafened = deaf;
		this.sendVoiceUpdate();
	}

	/**
	 * Set the mute status for the current bot user
	 * @param mute Boolean value to indicate whether to mute or unmute
	 * @defaultValue false
	 */
	public setMute(mute = false): void {
		this.muted = mute;
		this.sendVoiceUpdate();
	}

	/**
	 * Disconnect the current bot user from the connected voice channel
	 * @internal
	 */
	public disconnect(): void {
		if (this.state === ConnectionState.Disconnected) return;

		this.channelId = null;
		this.deafened = false;
		this.muted = false;

		this.removeAllListeners();
		this.sendVoiceUpdate();

		this.state = ConnectionState.Disconnected;

		this.debug(`[Voice] -> [Node] & [Discord] : Connection Destroyed | Guild: ${this.guildId}`);
	}

	/**
	 * Connect the current bot user to a voice channel
	 * @internal
	 */
	public async connect(): Promise<void> {
		if (this.state !== ConnectionState.Disconnected) return;

		this.state = ConnectionState.Connecting;

		this.sendVoiceUpdate();

		this.debug(`[Voice] -> [Discord] : Requesting Connection | Guild: ${this.guildId}`);

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.manager.options.voiceConnectionTimeout * 1000);

		try {
			const [ status ] = await once(this, 'connectionUpdate', { signal: controller.signal }) as [ VoiceState ];

			if (status !== VoiceState.SessionReady) {
				switch (status) {
					case VoiceState.SessionIdMissing: throw new Error('The voice connection is not established due to missing session id');
					case VoiceState.SessionEndpointMissing: throw new Error('The voice connection is not established due to missing connection endpoint');
				}
			}

			this.state = ConnectionState.Connected;
		} catch (e: unknown) {
			this.state = ConnectionState.Disconnected;

			const error = e as Error;

			this.debug(`[Voice] </- [Discord] : Request Connection Failed | Guild: ${this.guildId}`);

			if (error.name === 'AbortError')
				throw new Error(`The voice connection is not established in ${this.manager.options.voiceConnectionTimeout} seconds`);

			throw error;
		} finally {
			clearTimeout(timeout);
		}
	}

	/**
	 * Updates SessionId, ChannelId, Deafen and Mute data of this instance
	 * @param options
	 * @param options.session_id Id of the current session
	 * @param options.channel_id Id of the connected voice channel
	 * @param options.self_deaf Boolean that indicates if the current bot user is deafened or not
	 * @param options.self_mute Boolean that indicates if the current bot user is muted or not
	 * @internal
	 */
	public setStateUpdate({ session_id, channel_id, self_deaf, self_mute }: StateUpdatePartial): void {
		if (channel_id && channel_id !== this.channelId) {
			this.debug(`[Voice] <- [Discord] : Channel Moved | Old Channel: ${this.channelId} Guild: ${this.guildId}`);
		}

		this.channelId = channel_id ?? null;

		if (!this.channelId) {
			this.state = ConnectionState.Disconnected;
			this.debug(`[Voice] <- [Discord] : Channel Disconnected | Guild: ${this.guildId}`);
			this.manager.deleteConnection(this.guildId);
		}

		this.deafened = self_deaf;
		this.muted = self_mute;
		this.sessionId = session_id ?? null;

		this.debug(`[Voice] <- [Discord] : State Update Received | Channel: ${this.channelId} Session ID: ${session_id} Guild: ${this.guildId}`);
	}

	/**
	 * Sets the server update data for this connection
	 * @internal
	 */
	public setServerUpdate(data: ServerUpdate): void {
		if (!data.endpoint) {
			this.debug(`[Voice] <- [Discord] : Received a voice server update without an endpoint! Data => ${JSON.stringify(data)}`);
			this.emit('connectionUpdate', VoiceState.SessionEndpointMissing);
			return;
		}
		if (!this.sessionId) {
			this.debug(`[Voice] <- [Discord] : Received a voice server update without an session id! Data => ${JSON.stringify(data)}`);
			this.emit('connectionUpdate', VoiceState.SessionIdMissing);
			return;
		}

		const region = data.endpoint.split('.').shift()?.replace(/[0-9]/g, '');

		if (region !== this.region) {
			this.debug(`[Voice] <- [Discord] : Voice Region Moved | Old Region: ${this.region} New Region: ${region} Guild: ${this.guildId}`);
		}

		this.region = region ?? null;

		this.serverUpdate = data;

		this.emit('connectionUpdate', VoiceState.SessionReady);

		this.debug(`[Voice] <- [Discord] : Server Update Received | Server: ${this.region} Guild: ${this.guildId}`);

		const node = this.manager.nodes.find(n => n.connections.has(this));

		node?.rest
			.updatePlayer(this.guildId, {
				voice: {
					token: data.token,
					endpoint: data.endpoint,
					sessionId: this.sessionId
				}
			})
			.catch(() => null);
	}

	/**
	 * Send voice data to discord
	 * @internal
	 */
	public sendVoiceUpdate() {
		this.send({ guild_id: this.guildId, channel_id: this.channelId, self_deaf: this.deafened, self_mute: this.muted });
	}

	/**
	 * Send data to Discord
	 * @param data The data to send
	 * @internal
	 */
	private send(data: unknown): void {
		this.manager.connector.sendPacket(this.shardId, { op: 4, d: data });
	}

	/**
	 * Emits a debug log
	 * @internal
	 */
	private debug(message: string): void {
		this.manager.emit(Events.Debug, message);
	}
}
