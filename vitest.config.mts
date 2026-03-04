import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		name: 'Shoukaku',
		dir: './tests/',
		environment: 'node',
		passWithNoTests: true
	}
});
