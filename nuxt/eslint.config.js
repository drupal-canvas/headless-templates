import { recommended as drupalCanvasRecommended } from '@drupal-canvas/eslint-config';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default [
  ...drupalCanvasRecommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
    rules: {
      'vue/max-attributes-per-line': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-required-prop-with-default': 'off',
      'vue/no-v-html': 'off',
      'vue/require-default-prop': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
  {
    rules: {
      'drupal-canvas/component-exports': 'off',
      'drupal-canvas/component-imports': 'off',
    },
  },
  {
    ignores: ['.canvas/**', '.nuxt/**', '.output/**', 'dist/**', 'node_modules/**'],
  },
];
