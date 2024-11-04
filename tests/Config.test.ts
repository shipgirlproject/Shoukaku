import { describe, expect, test } from 'vitest';
import { ShoukakuOptions } from '../src/Shoukaku';
import { createShoukaku } from './mock/Utils';

describe('Configuration Merging', () => {
	test('String', () => {
		const options: { userAgent: ShoukakuOptions['userAgent'] } = {
			userAgent: 'ok'
		};

		const shoukaku = createShoukaku(options);

		expect(shoukaku.options.userAgent).toEqual(options.userAgent);
	});

	test('Number', () => {
		const options: { restTimeout: ShoukakuOptions['restTimeout'] } = {
			restTimeout: 123
		};

		const shoukaku = createShoukaku(options);

		expect(shoukaku.options.restTimeout).toEqual(options.restTimeout);
	});

	test('Boolean', () => {
		const options: { resume: ShoukakuOptions['resume'] } = {
			resume: true
		};

		const shoukaku = createShoukaku(options);

		expect(shoukaku.options.resume).toEqual(options.resume);
	});

	test('Function', () => {
		const options: { nodeResolver: ShoukakuOptions['nodeResolver'] } = {
			nodeResolver: (nodes) => [ ...nodes.values() ].shift()
		};

		const shoukaku = createShoukaku(options);

		expect(shoukaku.options.nodeResolver).toStrictEqual(options.nodeResolver);
	});
});
