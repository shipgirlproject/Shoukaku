import { setupServer } from 'msw/node';
import { describe, expect, test } from 'vitest';
import { playerObjectResponse, routePlannerResponse } from './mock/Responses';
import * as routes from './mock/routes/index';
import { createRest, registerServerHooks } from './mock/Utils';

describe('Basic succeeding HTTP requests', () => {

	describe('RoutePlanner', () => {
		const server = setupServer(
			routes.routePlanner.status,
			routes.routePlanner.freeAddress,
			routes.routePlanner.freeAll
		);

		registerServerHooks(server);

		test('status', async () => {
			const rest = createRest();
			const response = await rest.getRoutePlannerStatus();
			expect(response).toEqual(routePlannerResponse());
		});

		test('free address', async () => {
			const rest = createRest();
			const response = await rest.unmarkFailedAddress('127.0.0.1');
			expect(response).toEqual(undefined);
		});
	});

	describe('Players', () => {
		const server = setupServer(
			routes.players.list,
			routes.players.get,
			routes.players.update,
			routes.players.destroy
		);

		registerServerHooks(server);

		test('list', async () => {
			const rest = createRest();
			const response = await rest.getPlayers();
			expect(response).toEqual([ playerObjectResponse() ]);
		});

		test('get', async () => {
			const rest = createRest();
			const response = await rest.getPlayer('mock');
			expect(response).toEqual(playerObjectResponse());
		});
	});

	describe('Sessions', () => {
		const server = setupServer(

		);

		registerServerHooks(server);
	});

	describe('Track', () => {
		const server = setupServer(

		);

		registerServerHooks(server);
	});

	describe('Metadata', () => {
		const server = setupServer(

		);

		registerServerHooks(server);
	});
});
