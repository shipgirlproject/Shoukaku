// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import * as augu from '@augu/eslint-config';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    // @ts-expect-error incorrect type from package, but still compatible
    augu.javascript(),
    // temp disable due to rule move from typescript-eslint (ts) -> stylistic (style)
    // await augu.typescript(),
    {
        ignores: [
            'docs/',
            'dist/',
            'node_modules/',
        ],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            'indent': [ 'error', 4, { 'SwitchCase': 1 } ],
            'quotes': [ 'error', 'single' ],
            'brace-style': [ 'error', '1tbs' ],
            'object-curly-spacing': [ 'error', 'always' ],
            'array-bracket-spacing': [ 'error', 'always' ],
            'block-spacing': [ 'error', 'always' ],
            'arrow-spacing': 'error',
            'switch-colon-spacing': [ 'error', { 'after': true, 'before': false } ],
            'camelcase': 'off',
            'require-await': 'error',
        },
    },
);