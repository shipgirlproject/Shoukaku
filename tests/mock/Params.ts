export interface SessionParams {
	sessionId: string;
}

export interface PlayerParams extends SessionParams {
	guildId: string;
}
