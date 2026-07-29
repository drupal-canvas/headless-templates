import { recommended as drupalCanvasRecommended } from '@drupal-canvas/eslint-config';
import eslintPluginAstro from 'eslint-plugin-astro';

export default [
  ...drupalCanvasRecommended,
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      'drupal-canvas/component-exports': 'off',
      'drupal-canvas/component-imports': 'off',
    },
  },
  {
    ignores: ['.astro/**', '.canvas/**', 'dist/**', 'node_modules/**'],
  },
];
