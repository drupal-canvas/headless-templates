import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@drupal-canvas/headless-nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  // The Nuxt adapter currently ships TypeScript source. Let Nitro transform
  // its inlined server handlers even though they live in node_modules.
  nitro: {
    esbuild: {
      options: {
        exclude: /node_modules\/(?!@drupal-canvas\/headless)/,
      },
    },
  },
  app: {
    head: {
      title: 'Canvas Headless — Nuxt',
      htmlAttrs: { lang: 'en', class: 'h-full antialiased' },
      bodyAttrs: { class: 'flex min-h-full flex-col' },
      meta: [
        {
          name: 'description',
          content: 'A minimal Drupal Canvas headless frontend.',
        },
      ],
    },
  },
});
