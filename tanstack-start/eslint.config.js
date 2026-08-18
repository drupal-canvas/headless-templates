import { required as drupalCanvasRequired } from '@drupal-canvas/eslint-config'
import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  ...drupalCanvasRequired,
  {
    ignores: [
      '.canvas/**',
      '.output/**',
      '.tanstack/**',
      'dist/**',
      'eslint.config.js',
      'node_modules/**',
      'src/routeTree.gen.ts',
    ],
  },
]
