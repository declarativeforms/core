import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const eslintConfig = defineConfig([
  {
    // Scoped to the files the React plugins are registered for. Left unscoped,
    // this object also applies to `prettier.config.cjs`, where the plugins are
    // out of scope and referencing their rules is a config error.
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },

  {
    // Generated shadcn output. Every primitive exports its `cva` variants beside
    // the component, which is what this rule forbids, so the rule fires on each
    // one and the fix would mean hand-editing files the CLI owns. Turned off
    // here rather than downgraded, because the gate in AGENTS.md is 0 errors.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  globalIgnores(['dist/**']),
]);

export default eslintConfig;
