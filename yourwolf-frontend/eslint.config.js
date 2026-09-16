import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Layers that the pure-TypeScript domain/engine modules must never depend on.
const UI_LAYERS = ['api', 'hooks', 'components', 'pages', 'styles'];

// Server DTO / wire-format types. The domain models the game's rules and must not
// be shaped by what the API happens to send over the wire.
const TRANSPORT_LAYERS = ['types'];

/** Matches an import of `layer` at any relative depth (e.g. `../api`, `../../../styles/theme`). */
function layerPatterns(layers) {
  return layers.flatMap((layer) => [`**/${layer}`, `**/${layer}/**`]);
}

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // Enforces rules-of-hooks and exhaustive-deps. Both were referenced by an
  // eslint-disable in src/hooks/useRoles.ts long before the plugin was actually
  // installed, so neither rule was enforced anywhere until now.
  reactHooks.configs['recommended-latest'],
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
      // `recommended-latest` ships exhaustive-deps as a warning, so it only gates
      // CI by way of `--max-warnings 0` in the lint script. Promoting it to an error
      // keeps the rule blocking on its own merits rather than on a CLI flag that a
      // future change could relax without anyone noticing the rule went quiet.
      // Currently a no-op: `--max-warnings 0` already passes, so there are no
      // outstanding exhaustive-deps warnings for this to newly surface.
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    // Import boundary: src/domain, src/engine, and src/data are pure TypeScript
    // layers. They must not reach up into React or any UI/transport layer.
    //
    // Transport DTOs leaked into the domain before the transport/domain type split
    // because `types` was simply absent from the restricted groups below, not
    // because of any type-import blind spot: both the base and typescript-eslint
    // rules report `import type` against a path pattern. The typescript-eslint
    // variant is used here for the `allowTypeImports` option (left at its default
    // of false), which the base rule does not offer.
    files: [
      'src/domain/**/*.{ts,tsx}',
      'src/engine/**/*.{ts,tsx}',
      'src/data/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/**', 'react-dom', 'react-dom/**'],
              message:
                'src/domain, src/engine, and src/data must stay pure TypeScript — no React imports.',
            },
            {
              group: layerPatterns(UI_LAYERS),
              message:
                'src/domain, src/engine, and src/data must not import from api, hooks, components, pages, or styles. Dependencies point inward.',
            },
            {
              group: [...layerPatterns(TRANSPORT_LAYERS), '@/types', '@/types/**'],
              message:
                'src/domain, src/engine, and src/data must not import transport DTOs from src/types — declare the shape each pure layer needs locally; transport types may depend on pure-layer types, never the reverse.',
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
