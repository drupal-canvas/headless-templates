import node from '@astrojs/node';
import canvas from '@drupal-canvas/headless-astro/integration';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [canvas()],
  vite: {
    plugins: [tailwindcss()],
  },
});
