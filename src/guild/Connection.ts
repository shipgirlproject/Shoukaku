import { EventEmitter, once } from 'events';
import { State, VoiceState } from '../Constants';
import { VoiceChannelOptions } from '../node/Node';
import { Player } from './Player';
import AbortController from 'abort-controller';

export interface StateUpdatePartial {
    channel_id?: string;
    session_id?: string;
    self_deaf: boolean;
    self_mute: boolean;
}

export interface ServerUpdate {
    token: string;
    guild_id: string;
    endpoint: string;
}

export class Connection extends EventEmitter {
    public readonly player: Player;
    public guildId: string;
    public channelId: string|null;
    public shardId: number;
    public sessionId: string|null;
    public region: string|null;
    public muted: boolean;
    public deafened: boolean;
    public state: State;
    public moved: Boolean;
    public reconnecting: Boolean;
    private serverUpdate: ServerUpdate|null;
    constructor(player: Player, options: VoiceChannelOptions) {
        super();
        this.player = player;
        this.guildId = options.guildId;
        this.channelId = null;
        this.shardId = options.shardId;
        this.sessionId = null;
        this.region = null;
        this.muted = false;
        this.deafened = false;
        this.state = State.DISCONNECTED;
        this.moved = false;
        this.reconnecting = false;
        this.serverUpdate = null;
    }

    public setDeaf(deaf = false): void {
        this.deafened = deaf;
        this.send({ guild_id: this.guildId, channel_id: this.channelId, self_deaf: this.deafened, self_mute: this.muted }, true);
    }

    public setMute(mute = false): void {
        this.muted = mute;
        this.send({ guild_id: this.guildId, channel_id: this.channelId, self_deaf: this.deafened, self_mute: this.muted }, true);
    }

    public disconnect(): void {
        if (this.state !== State.DISCONNECTED) {
            this.state = State.DISCONNECTING;
            this.send({ guild_id: this.guildId, channel_id: null, self_mute: false, self_deaf: false }, true);
        }
        this.player.node.players.delete(this.guildId);
        // this.player.clean();
        this.destroyLavalinkPlayer();
        this.state = State.DISCONNECTED;
        this.player.node.emit('debug', this.player.node.name, `[Voice] -> [Node] & [Discord] : Link & Player Destroyed | Guild: ${this.guildId}`);
    }

    public async connect({ guildId, channelId, deaf, mute }: VoiceChannelOptions): Promise<void> {
        this.state = State.CONNECTING;
        this.send({ guild_id: guildId, channel_id: channelId, self_deaf: deaf, self_mute: mute }, true);
        this.player.node.emit('debug', this.player.node.name, `[Voice] -> [Discord] : Requesting Connection | Guild: ${this.guildId}`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const [status] = await once(this, 'connectionUpdate', { signal: controller.signal });
            if (status !== VoiceState.SESSION_READY) {
                if (status === VoiceState.SESSION_ID_MISSING)
                    throw new Error('The voice connection is not established due to missing session id');
                else
                    throw new Error('The voice connection is not established due to missing connection endpoint');
            }
            this.state = State.CONNECTED;
        } catch (error: any) {
            this.player.node.emit('debug', this.player.node.name, `[Voice] </- [Discord] : Request Connection Failed | Guild: ${this.guildId}`);
            if (error.name === 'AbortError')
                throw new Error('The voice connection is not established in 15 seconds');
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    public setStateUpdate({ session_id, channel_id, self_deaf, self_mute }: StateUpdatePartial): void {
        if (this.channelId && (channel_id && this.channelId !== channel_id)) {
            this.moved = true;
            this.player.node.emit('debug', this.player.node.name, `[Voice] <- [Discord] : Channel Moved | Old Channel: ${this.channelId} Guild: ${this.guildId}`);
        }
        this.channelId = channel_id || this.channelId;
        if (!channel_id) {
            this.state = State.DISCONNECTED;
            this.player.node.emit('debug', this.player.node.name, `[Voice] <- [Discord] : Channel Disconnected | Guild: ${this.guildId}`);
        }
        this.deafened = self_deaf;
        this.muted = self_mute;
        this.sessionId = session_id || null;
        this.player.node.emit('debug', this.player.node.name, `[Voice] <- [Discord] : State Update Received | Channel: ${this.channelId} Session ID: ${session_id} Guild: ${this.guildId}`);
    }

    public setServerUpdate(data: ServerUpdate): void {
        if (!data.endpoint) {
            this.emit('connectionUpdate', VoiceState.SESSION_ENDPOINT_MISSING);
            return;
        }
        if (!this.sessionId) {
            this.emit('connectionUpdate', VoiceState.SESSION_ID_MISSING);
            return;
        }
        if (this.region && !data.endpoint.startsWith(this.region)) {
            this.moved = true;
            this.player.node.emit('debug', this.player.node.name, `[Voice] <- [Discord] : Voice Region Moved | Old Region: ${this.region} Guild: ${this.guildId}`);
        }
        this.region = data.endpoint.split('.').shift()?.replace(/[0-9]/g, '') || null;
        this.serverUpdate = data;
        this.player.node.queue.add({ op: 'voiceUpdate', guildId: this.guildId, sessionId: this.sessionId, event: this.serverUpdate });
        this.player.node.emit('debug', this.player.node.name, `[Voice] <- [Discord] : Server Update, Voice Update Sent | Server: ${this.region} Guild: ${this.guildId}`);
        this.emit('connectionUpdate', VoiceState.SESSION_READY);
    }

    public resendServerUpdate(): void {
        if (!this.serverUpdate) return;
        this.player.node.queue.add({ op: 'voiceUpdate', guildId: this.guildId, sessionId: this.sessionId, event: this.serverUpdate });
        this.player.node.emit('debug', this.player.node.name, `[Voice] <- [Discord] : Server Update, voice Update Resent! | Server: ${this.region} Guild: ${this.guildId}`);
    }

    public destroyLavalinkPlayer(): void {
        this.player.node.queue.add({ op: 'destroy', guildId: this.guildId });
        this.player.node.emit('debug', this.player.node.name, `[Voice] -> [Discord] : Destroyed the player on Lavalink | Server: ${this.region} Guild: ${this.guildId}`);
    }

    private send(data: any, important = false): void {
        this.player.node.manager.connector.sendPacket(this.shardId, { op: 4, d: data }, important);
    }
}