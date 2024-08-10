// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
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
            'docs/*',
            'dist/*',
            'node_modules/*',
        ],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            '@stylistic/semi': [ 'error' ],
            '@stylistic/member-delimiter-style': [ 'error' ],
            '@stylistic/indent': [ 'error', 4, { 'SwitchCase': 1 }],
            '@stylistic/space-infix-ops': [ 'error' ],
            '@stylistic/key-spacing': [ 'error', { 'mode': 'strict' }],
            '@stylistic/keyword-spacing': [ 'error' ],
            '@stylistic/indent-binary-ops': [ 'error', 4 ],
            '@stylistic/type-generic-spacing': [ 'error' ],
            '@stylistic/type-named-tuple-spacing': [ 'error' ],
            '@stylistic/type-annotation-spacing': [ 'error', { 'before': false, 'after': true, 'overrides': { 'arrow': { 'before': true, 'after': true }}}],
            '@stylistic/quotes': [ 'error', 'single' ],
            '@stylistic/comma-dangle': [ 'error', 'always-multiline' ],
            '@stylistic/brace-style': [ 'error', '1tbs' ],
            '@stylistic/object-curly-spacing': [ 'error', 'always', { 'objectsInObjects': false, 'arraysInObjects': false }],
            '@stylistic/array-bracket-spacing': [ 'error', 'always', { 'objectsInArrays': false, 'arraysInArrays': false }],
            '@stylistic/block-spacing': [ 'error', 'always' ],
            '@stylistic/arrow-spacing': 'error',
            '@stylistic/switch-colon-spacing': [ 'error', { 'after': true, 'before': false }],
            'camelcase': 'off',
            'require-await': 'error',
        },
    },
);