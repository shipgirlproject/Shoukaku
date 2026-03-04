import EventEmitter from 'node:events';
import type { SetupServerApi } from 'msw/node';
import { createColors } from 'picocolors';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { Connector } from '../../src/connectors/Connector';
import type { Node } from '../../src/node/Node';
import { Rest } from '../../src/node/Rest';
import { NodeOption, Shoukaku, ShoukakuOptions } from '../../src/Shoukaku';

const c = createColors();

export function registerServerHooks(server: SetupServerApi) {
	server.events.on('request:start', ({ request }) => {
		const origin = new URL(request.url).origin;
		const other = request.url.replace(origin, '');
		console.log(`${c.bgMagenta(` ${request.method} `)} ${c.dim(`${origin}`)}${c.yellowBright(other)} `);
	});

	beforeAll(() => server.listen());
	afterEach(() => server.resetHandlers());
	afterAll(() => server.close());
}

export const BASE_HOST = 'lavalinkmock.local';
export const PASSWORD = 'mock';

export function path(path: string) {
	return `http://${BASE_HOST}/v4${path}`;
}

export function checkAuth(request: Request) {
	const header = request.headers.get('Authorization');
	return header === PASSWORD;
}

export function createRest(options?: {
	failing?: boolean;
	badAuth?: boolean;
}) {
	const identifier = options?.failing ? 'error' : 'mock';

	const node = mock<Node>({
		sessionId: identifier,
		manager: {
			options: {
				userAgent: `mock/0 (${BASE_HOST})`,
				restTimeout: 60
			}
		}
	});

	const rest = new Rest(node, {
		name: identifier,
		url: BASE_HOST,
		auth: options?.badAuth ? 'bad' : 'mock'
	});

	return rest;
}

type PublicConstructor<T> = new () => T;

export function createStubConnector({ id, packetHandler, eventEmitter }: {
	id: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	packetHandler: (shardId: number, payload: any, important: boolean) => void;
	eventEmitter: EventEmitter;
}): PublicConstructor<Connector> {
	return class StubConnector extends Connector {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		public sendPacket(shardId: number, payload: any, important: boolean): void {
			packetHandler(shardId, payload, important);
		}

		public getId(): string {
			return id;
		}

		public listen(nodes: NodeOption[]): void {
			eventEmitter.once('ready', () => this.ready(nodes));
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			eventEmitter.on('raw', (packet: any) => this.raw(packet));
		}
	} as PublicConstructor<Connector>;
};

export function createShoukaku(options?: ShoukakuOptions) {
	const StubConnector = createStubConnector({
		id: 'stub',
		packetHandler: () => null,
		eventEmitter: new EventEmitter()
	});

	const shoukaku = new Shoukaku(new StubConnector(), [], options);

	return shoukaku;
}
