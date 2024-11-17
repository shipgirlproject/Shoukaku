import { http, HttpHandler, HttpResponse } from 'msw';
import { LavalinkPlayer, UpdatePlayerOptions } from '../../../src/node/Rest';
import type { PlayerParams, SessionParams } from '../Params';
import { playerObjectResponse } from '../Responses';
import { noContent, ok } from '../Status';
import { path } from '../Utils';

export const list: HttpHandler = http.get<SessionParams, never, LavalinkPlayer[]>(path('/sessions/:sessionId/players'), () => {
	return HttpResponse.json([ playerObjectResponse() ], ok);
});

export const get: HttpHandler = http.get<PlayerParams, never, LavalinkPlayer>(path('/sessions/:sessionId/players/:guildId'), () => {
	return HttpResponse.json(playerObjectResponse(), ok);
});

export const update: HttpHandler = http.patch<PlayerParams, UpdatePlayerOptions, LavalinkPlayer>(path('/sessions/:sessionId/players/:guildId'), ({ request }) => {
	const noReplace = new URL(request.url).searchParams.get('noReplace');
	if (noReplace && noReplace !== 'true' && noReplace !== 'false') {
		// do nothing until i figure out how ll handles these
		// also this would never happen anyways so i doubt there is a point in testing this
	}
	return HttpResponse.json(playerObjectResponse(), ok);
});

export const destroy: HttpHandler = http.delete<PlayerParams, never, never>(path('/sessions/:sessionId/players/:guildId'), () => {
	return HttpResponse.json(null, noContent);
});
