import { VoiceState } from './Library';

export class ShoukakuError<T> extends Error {
	public readonly context: T;
	constructor(context: T, message: string) {
		super(message);
		this.context = context;
	}
}

export class MergeError<T> extends Error {
	public readonly supplied: T;
	constructor(key: string, supplied: T) {
		super(`${key} was not found from the given options`);
		this.supplied = supplied;
	}
}

export class UnexpectedError extends Error {
	constructor() {
		super('Unexepcted undefined value on a variable that is supposed not to');
	}
}

export class ConnectionError extends Error {
	public readonly type: VoiceState;
	constructor(type: VoiceState) {
		let message: string;

		switch (type) {
			case VoiceState.SessionEndpointMissing: {
				message = 'The voice connection is not established due to missing connection endpoint';
				break;
			}
			case VoiceState.SessionIdMissing: {
				message = 'The voice connection is not established due to missing session id';
				break;
			}
			default: throw new UnexpectedError();
		}

		super(message);

		this.type = type;
	}
}

export class ConnectionConnectTimeout extends Error {
	constructor(time: number) {
		super(`The voice connection is not established in ${time} second(s)`);
	}
}

export class PlayerDerefError extends Error {
	constructor(guildId: string) {
		super(`The guild (${guildId}) connection can't be found, either you try to recreate the connection, or clean this up`);
	}
}
