// @ts-check
import config from '@shipgirl/eslint-config';

export default [
	...config(
		import.meta.dirname,
		{
			rules: {
				'import-x/extensions': 'off'
			}
		}
	)
];
