<script setup lang="ts">defineProps<{ image: { src: string, alt?: string, width?: number, height?: number } }>()</script>

<template>
  <img v-if="image?.src" :src="image.src" :alt="image.alt || ''" :width="image.width" :height="image.height" class="my-8 h-auto max-w-full">
</template>
