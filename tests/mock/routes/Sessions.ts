import { http, HttpHandler, HttpResponse } from 'msw';
import { SessionInfo } from '../../../src/node/Rest';
import type { SessionParams } from '../Params';
import { sessionUpdateResponse } from '../Responses';
import { ok } from '../Status';
import { path } from '../Utils';

export const update: HttpHandler = http.get<SessionParams, never, SessionInfo>(path('/sessions/:sessionId'), () => {
	return HttpResponse.json(sessionUpdateResponse(), ok);
});
