import { defineConfig } from "eslint/config";
import common from "eslint-config-neon/common";
import node from "eslint-config-neon/node";
import prettier from "eslint-config-neon/prettier";
import typescript from "eslint-config-neon/typescript";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import merge from "lodash.merge";

const commonFiles = "{js,mjs,cjs,ts,mts,cts,jsx,tsx}";
const project = ["tsconfig.eslint.json"];

const commonRuleset = merge(...common, {
	files: [`**/*${commonFiles}`],
	rules: {
		"no-eq-null": 0,
		eqeqeq: [2, "always", { null: "ignore" }],
		"jsdoc/no-undefined-types": 0,
	},
});

const nodeRuleset = merge(...node, {
	files: [`**/*${commonFiles}`],
	rules: {
		"no-restricted-globals": 0,
		"n/prefer-global/buffer": [2, "never"],
		"n/prefer-global/console": [2, "always"],
		"n/prefer-global/process": [2, "never"],
		"n/prefer-global/text-decoder": [2, "always"],
		"n/prefer-global/text-encoder": [2, "always"],
		"n/prefer-global/url-search-params": [2, "always"],
		"n/prefer-global/url": [2, "always"],
	},
});
const prettierRuleset = merge(...prettier, { files: [`**/*${commonFiles}`] });
const typeScriptRuleset = merge(...typescript, {
	files: [`**/*${commonFiles}`],
	languageOptions: {
		parserOptions: {
			warnOnUnsupportedTypeScriptVersion: false,
			allowAutomaticSingleRunInference: true,
			project,
		},
	},
	rules: {
		"@typescript-eslint/consistent-type-definitions": [2, "interface"],
		"@typescript-eslint/no-base-to-string": 0,
		"@stylistic/js/array-element-newline": 0,
		"@typescript-eslint/triple-slash-reference": [0],
		"no-unreachable-loop": 2,
		"@typescript-eslint/unbound-method": 0,
		"id-length": [0],
		"@typescript-eslint/prefer-literal-enum-member": [2, { allowBitwiseExpressions: true }],
		"@typescript-eslint/naming-convention": [
			2,
			{
				selector: "typeParameter",
				format: ["PascalCase"],
				custom: {
					regex: "^\\w{3,}",
					match: true,
				},
			},
		],
	},
	settings: {
		"import-x/resolver-next": [
			createTypeScriptImportResolver({
				noWarnOnMultipleProjects: true,
				project,
			}),
		],
	},
});

export default defineConfig(
	{
		ignores: ["**/node_modules/", ".git/", "**/dist/"],
	},
	commonRuleset,
	nodeRuleset,
	typeScriptRuleset,
	{
		files: ["**/*{ts,mts,cts,tsx}"],
		rules: { "jsdoc/no-undefined-types": 0 },
	},
	{
		files: ["**/*{js,mjs,cjs,jsx}"],
		rules: { "tsdoc/syntax": 0 },
	},
	prettierRuleset,
	{
		files: [`**/*${commonFiles}`],
		rules: {
			curly: [2, "all"],
		},
	},
);
