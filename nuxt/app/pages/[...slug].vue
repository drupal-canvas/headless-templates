<script setup lang="ts">
import {
  isPageRedirect,
  type Page,
  type PageResult,
} from '@drupal-canvas/headless';

type NuxtHeadInput = Parameters<typeof useHead>[0];

const route = useRoute();
const slug = computed(() =>
  Array.isArray(route.params.slug)
    ? route.params.slug.join('/')
    : (route.params.slug ?? ''),
);
const path = computed(
  () => `/${slug.value.split('/').map(encodeURIComponent).join('/')}`,
);
const { data: result } = await useFetch<PageResult | null>('/api/page', {
  query: { path },
});

const redirectResult = computed(() =>
  result.value && isPageRedirect(result.value) ? result.value.redirect : null,
);

if (redirectResult.value) {
  await navigateTo(redirectResult.value.url, {
    external: redirectResult.value.external,
    redirectCode: redirectResult.value.statusCode,
  });
}

watch(redirectResult, async (redirect) => {
  if (redirect) {
    await navigateTo(redirect.url, {
      external: redirect.external,
      redirectCode: redirect.statusCode,
    });
  }
});

const page = computed<Page | null>(() => {
  const value = result.value;
  return value && !isPageRedirect(value) ? value : null;
});

if (import.meta.server && !result.value) {
  setResponseStatus(useRequestEvent()!, 404);
}

useHead(
  (() => page.value?.head ?? { title: 'Not found' }) as NuxtHeadInput,
);
</script>

<template>
  <CanvasComponentTree v-if="page" :tree="page.content" />
  <main v-else class="mx-auto w-full max-w-2xl px-6 py-10">
    <p class="mb-6">
      <NuxtLink to="/" class="text-sm underline">← Back to home</NuxtLink>
    </p>
    <h1 class="mb-2 text-3xl font-bold">Not found</h1>
    <p class="text-sm text-gray-500">
      Drupal answered nothing for
      <code class="rounded bg-gray-100 px-1">{{ path }}</code>.
    </p>
  </main>
</template>
