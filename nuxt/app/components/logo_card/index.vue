<script setup lang="ts">
withDefaults(defineProps<{
  backgroundColor?: string
  image: { src: string, alt?: string, width?: number, height?: number }
}>(), { backgroundColor: '#F1F5F9' })
</script>

<template>
  <div v-if="image?.src" class="align-center flex max-h-33 max-w-50 flex-col justify-center gap-4 rounded-2xl p-6 leading-[normal]" :style="{ backgroundColor }">
    <img :src="image.src" :alt="image.alt || ''" :width="image.width" :height="image.height" class="h-auto w-50 object-contain">
  </div>
</template>
