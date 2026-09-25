import common from "eslint-config-neon/oxlint/common";
import node from "eslint-config-neon/oxlint/node";
import prettier from "eslint-config-neon/oxlint/prettier";
import typescript from "eslint-config-neon/oxlint/typescript";
import { defineConfig } from "oxlint";

const plugins = [...new Set([...common.plugins, ...node.plugins, ...typescript.plugins, ...prettier.plugins])];

export default defineConfig({
	extends: [common, node, typescript, prettier],
	plugins,
	ignorePatterns: ["**/node_modules/", ".git/", "**/dist/", "**/docs/"],
	rules: {
		"no-eq-null": 0,
		"no-restricted-globals": 0,
		eqeqeq: [2, "always", { null: "ignore" }],
		"no-unreachable-loop": 2,
		curly: [2, "all"],
		"id-length": 0,
		"unicorn/prefer-node-protocol": 2,
		"@typescript-eslint/triple-slash-reference": 0,
		"@typescript-eslint/unbound-method": 0,
		"@typescript-eslint/no-base-to-string": 0,
		"@typescript-eslint/consistent-type-definitions": [2, "interface"],
		"@typescript-eslint/prefer-literal-enum-member": [2, { allowBitwiseExpressions: true }],
	},
	options: {
		reportUnusedDisableDirectives: "off",
		typeAware: true,
		typeCheck: true,
	},
});
