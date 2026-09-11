import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    // Scoped to the files eslint-config-next registers `react-hooks` for. Left
    // unscoped, this object also applies to `prettier.config.cjs`, where the
    // plugin is out of scope and referencing its rule is a config error.
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true },
      ],
      // Pre-existing pattern in the address autocomplete effect, carried over
      // unchanged from the Vite app. Kept visible as a warning rather than
      // refactored: reworking it would change autocomplete behaviour.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  {
    files: [
      'src/components/declarative-form/fields/turnstile/turnstile-field.component.tsx',
    ],
    rules: {
      'react-hooks/refs': 'off',
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
