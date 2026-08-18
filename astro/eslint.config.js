import { recommended as drupalCanvasRecommended } from '@drupal-canvas/eslint-config';
import eslintPluginAstro from 'eslint-plugin-astro';

export default [
  ...drupalCanvasRecommended,
  ...eslintPluginAstro.configs.recommended,
  {
    ignores: ['.astro/**', '.canvas/**', 'dist/**', 'node_modules/**'],
  },
];
