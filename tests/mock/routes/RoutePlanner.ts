import { http, HttpHandler, HttpResponse } from 'msw';
import { RoutePlanner } from '../../../src/node/Rest';
import { routePlannerResponse } from '../Responses';
import { noContent, ok } from '../Status';
import { path } from '../Utils';

export const status: HttpHandler = http.get<never, never, RoutePlanner>(path('/routeplanner/status'), () => {
	return HttpResponse.json(routePlannerResponse(), ok);
});

export const freeAddress: HttpHandler = http.post<never, never, never>(path('/routeplanner/free/address'), () => {
	return new HttpResponse(null, noContent);
});

export const freeAll: HttpHandler = http.post<never, never, never>(path('/routeplanner/free/all'), () => {
	return new HttpResponse(null, noContent);
});
