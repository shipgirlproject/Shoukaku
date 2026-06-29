import { EventEmitter, once } from "node:events";
import { clearTimeout, setTimeout } from "node:timers";
import { State, VoiceState } from "../Constants.js";
import type { Shoukaku, VoiceChannelOptions } from "../Shoukaku.js";

/**
 * Represents the partial payload from a stateUpdate event
 */
export interface StateUpdatePartial {
	channel_id?: string;
	self_deaf: boolean;
	self_mute: boolean;
	session_id?: string;
}

/**
 * Represents the payload from a serverUpdate event
 */
export interface ServerUpdate {
	endpoint: string;
	guild_id: string;
	token: string;
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
	 * Id of the voice channel where this instance was connected before the current channelId
	 */
	public lastChannelId: string | null;

	/**
	 * Id of the currently active voice channel connection
	 */
	public sessionId: string | null;

	/**
	 * Region of connected voice channel
	 */
	public region: string | null;

	/**
	 * Last region of the connected voice channel
	 */
	public lastRegion: string | null;

	/**
	 * Cached serverUpdate event from Lavalink
	 */
	public serverUpdate: ServerUpdate | null;

	/**
	 * Connection state
	 */
	public state: State;

	public constructor(manager: Shoukaku, options: VoiceChannelOptions) {
		super();
		this.manager = manager;
		this.guildId = options.guildId;
		this.channelId = options.channelId;
		this.shardId = options.shardId;
		this.muted = options.mute ?? false;
		this.deafened = options.deaf ?? false;
		this.lastChannelId = null;
		this.sessionId = null;
		this.region = null;
		this.lastRegion = null;
		this.serverUpdate = null;
		this.state = State.DISCONNECTED;
	}

	/**
	 * Set the deafen status for the current bot user
	 *
	 * @param deaf - Boolean value to indicate whether to deafen or undeafen
	 * @defaultValue false
	 */
	public setDeaf(deaf = false): void {
		this.deafened = deaf;
		this.sendVoiceUpdate();
	}

	/**
	 * Set the mute status for the current bot user
	 *
	 * @param mute - Boolean value to indicate whether to mute or unmute
	 * @defaultValue false
	 */
	public setMute(mute = false): void {
		this.muted = mute;
		this.sendVoiceUpdate();
	}

	/**
	 * Disconnect the current bot user from the connected voice channel
	 *
	 * @internal
	 */
	public disconnect(): void {
		if (this.state === State.DISCONNECTED) {
			return;
		}

		this.channelId = null;
		this.deafened = false;
		this.muted = false;
		this.removeAllListeners();
		this.sendVoiceUpdate();
		this.state = State.DISCONNECTED;
		this.debug(`[Voice] -> [Node] & [Discord] : Connection Destroyed | Guild: ${this.guildId}`);
	}

	/**
	 * Connect the current bot user to a voice channel
	 *
	 * @internal
	 */
	public async connect(): Promise<void> {
		if (this.state === State.CONNECTING || this.state === State.CONNECTED) {
			return;
		}

		this.state = State.CONNECTING;
		this.sendVoiceUpdate();
		this.debug(`[Voice] -> [Discord] : Requesting Connection | Guild: ${this.guildId}`);

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.manager.options.voiceConnectionTimeout * 1_000);

		try {
			const [status] = (await once(this, "connectionUpdate", { signal: controller.signal })) as [VoiceState];
			if (status !== VoiceState.SESSION_READY) {
				// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
				switch (status) {
					case VoiceState.SESSION_ID_MISSING:
						throw new Error("The voice connection is not established due to missing session id");
					case VoiceState.SESSION_ENDPOINT_MISSING:
						throw new Error("The voice connection is not established due to missing connection endpoint");
				}
			}
		} catch (error) {
			this.state = State.DISCONNECTED;
			this.debug(`[Voice] </- [Discord] : Request Connection Failed | Guild: ${this.guildId}`);
			if ((error as Error).name === "AbortError") {
				throw new Error(
					`The voice connection is not established in ${this.manager.options.voiceConnectionTimeout} seconds`,
				);
			}

			throw error;
		} finally {
			clearTimeout(timeout);
		}
	}

	/**
	 * Updates SessionId, ChannelId, Deafen and Mute data of this instance
	 *
	 * @param options - The partial state update payload
	 * @internal
	 */
	public setStateUpdate(options: StateUpdatePartial): void {
		const { session_id, channel_id, self_deaf, self_mute } = options;
		this.lastChannelId = this.channelId?.repeat(1) ?? null;
		this.channelId = channel_id ?? null;

		if (this.channelId && this.lastChannelId !== this.channelId) {
			this.debug(`[Voice] <- [Discord] : Channel Moved | Old Channel: ${this.lastChannelId} Guild: ${this.guildId}`);
		}

		if (!this.channelId) {
			this.state = State.DISCONNECTED;
			this.debug(`[Voice] <- [Discord] : Channel Disconnected | Guild: ${this.guildId}`);
		}

		this.deafened = self_deaf;
		this.muted = self_mute;
		this.sessionId = session_id ?? null;
		this.debug(
			`[Voice] <- [Discord] : State Update Received | Channel: ${this.channelId} Session ID: ${session_id} Guild: ${this.guildId}`,
		);
	}

	/**
	 * Sets the server update data for this connection
	 *
	 * @internal
	 */
	public setServerUpdate(data: ServerUpdate): void {
		if (!data.endpoint) {
			this.emit("connectionUpdate", VoiceState.SESSION_ENDPOINT_MISSING);
			return;
		}

		if (!this.sessionId) {
			this.emit("connectionUpdate", VoiceState.SESSION_ID_MISSING);
			return;
		}

		this.lastRegion = this.region?.repeat(1) ?? null;
		this.region = data.endpoint.split(".").shift()?.replaceAll(/\d/g, "") ?? null;

		if (this.region && this.lastRegion !== this.region) {
			this.debug(
				`[Voice] <- [Discord] : Voice Region Moved | Old Region: ${this.lastRegion} New Region: ${this.region} Guild: ${this.guildId}`,
			);
		}

		this.serverUpdate = data;
		this.emit("connectionUpdate", VoiceState.SESSION_READY);
		this.debug(`[Voice] <- [Discord] : Server Update Received | Server: ${this.region} Guild: ${this.guildId}`);
	}

	/**
	 * Send voice data to discord
	 *
	 * @internal
	 */
	private sendVoiceUpdate() {
		this.send({
			guild_id: this.guildId,
			channel_id: this.channelId,
			self_deaf: this.deafened,
			self_mute: this.muted,
		});
	}

	/**
	 * Send data to Discord
	 *
	 * @param data - The data to send
	 * @internal
	 */
	private send(data: unknown): void {
		this.manager.connector.sendPacket(this.shardId, { op: 4, d: data }, false);
	}

	/**
	 * Emits a debug log
	 *
	 * @internal
	 */
	private debug(message: string): void {
		this.manager.emit("debug", this.constructor.name, message);
	}
}
