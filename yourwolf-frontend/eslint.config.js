import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Layers that the pure-TypeScript domain/engine modules must never depend on.
const UI_LAYERS = ['api', 'hooks', 'components', 'pages', 'styles'];

/** Matches an import of `layer` at any relative depth (e.g. `../api`, `../../../styles/theme`). */
function layerPatterns(layers) {
  return layers.flatMap((layer) => [`**/${layer}`, `**/${layer}/**`]);
}

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {argsIgnorePattern: '^_', varsIgnorePattern: '^_'},
      ],
    },
  },
  {
    // Import boundary: src/domain (and the future src/engine) is a pure TypeScript
    // layer. It must not reach up into React or any UI/transport layer.
    files: ['src/domain/**/*.{ts,tsx}', 'src/engine/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/**', 'react-dom', 'react-dom/**'],
              message:
                'src/domain and src/engine must stay pure TypeScript — no React imports.',
            },
            {
              group: layerPatterns(UI_LAYERS),
              message:
                'src/domain and src/engine must not import from api, hooks, components, pages, or styles. Dependencies point inward.',
            },
          ],
        },
      ],
    },
  },
  {
    // Components consume data through hooks, not by calling the API layer directly.
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: layerPatterns(['api']),
              message:
                'src/components must not import src/api directly — use a hook from src/hooks.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
);
