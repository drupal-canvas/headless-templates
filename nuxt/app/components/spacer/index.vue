<script setup lang="ts">
const props = withDefaults(defineProps<{ height: 'small' | 'medium' | 'large' | 'extra_large' }>(), { height: 'small' })
const heights = { small: 'h-8', medium: 'h-12', large: 'h-16', extra_large: 'h-24' }
</script>

<template><div :class="heights[props.height]" aria-hidden="true" /></template>
