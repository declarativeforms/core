import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      // Pre-existing pattern in the address autocomplete effect, carried over
      // unchanged from the Vite app. Kept visible as a warning rather than
      // refactored: reworking it would change autocomplete behaviour.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
