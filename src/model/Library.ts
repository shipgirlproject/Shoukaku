export enum ConnectionState {
	Connecting,
	Connected,
	Disconnecting,
	Disconnected
}

export enum VoiceState {
	SessionReady,
	SessionIdMissing,
	SessionEndpointMissing,
	SessionFailedUpdate
}

export enum Events {
	Reconnecting = 'reconnecting',
	Debug = 'debug',
	Error = 'error',
	Ready = 'ready',
	Close = 'close',
	Disconnect = 'disconnect',
	PlayerUpdate = 'playerUpdate',
	PlayerEvent = 'playerEvent'
}
