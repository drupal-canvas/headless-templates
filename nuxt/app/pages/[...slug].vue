<script setup lang="ts">
import type { Page } from '@drupal-canvas/headless/server';

const route = useRoute();
const slug = computed(() =>
  Array.isArray(route.params.slug)
    ? route.params.slug.join('/')
    : (route.params.slug ?? ''),
);
const path = computed(
  () => `/${slug.value.split('/').map(encodeURIComponent).join('/')}`,
);
const { data: page } = await useFetch<Page | null>(
  () => `/api/page${path.value}`,
);

if (import.meta.server && !page.value) {
  setResponseStatus(useRequestEvent()!, 404);
}

useHead({
  title: () => (page.value?.title ? String(page.value.title) : 'Not found'),
});
</script>

<template>
  <CanvasComponentTree v-if="page" :tree="page.content" />
  <main v-else class="mx-auto w-full max-w-2xl px-6 py-10">
    <p class="mb-6">
      <NuxtLink to="/" class="text-sm underline">← All content</NuxtLink>
    </p>
    <h1 class="mb-2 text-3xl font-bold">Not found</h1>
    <p class="text-sm text-gray-500">
      Drupal answered nothing for
      <code class="rounded bg-gray-100 px-1">{{ path }}</code>.
    </p>
  </main>
</template>
