<script setup lang="ts">
const props = withDefaults(defineProps<{
  layout?: string
  gap?: 'extra_small' | 'small' | 'medium' | 'large' | 'extra_large'
}>(), { layout: '33-33-33', gap: 'medium' })
const layouts: Record<string, string> = {
  '50-50': 'md:grid-cols-[1fr_1fr]', '33-33-33': 'md:grid-cols-[1fr_1fr_1fr]', '75-25': 'md:grid-cols-[3fr_1fr]',
  '25-75': 'md:grid-cols-[1fr_3fr]', '67-33': 'md:grid-cols-[2fr_1fr]', '33-67': 'md:grid-cols-[1fr_2fr]',
  '50-25-25': 'md:grid-cols-[2fr_1fr_1fr]', '25-25-50': 'md:grid-cols-[1fr_1fr_2fr]',
  '25-25-25-25': 'sm:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr_1fr_1fr]',
}
const gaps = { extra_small: 'gap-1', small: 'gap-2', medium: 'gap-4', large: 'gap-6', extra_large: 'gap-8' }
</script>

<template>
  <div class="mx-auto w-full max-w-[1360px] px-6">
    <div :class="['grid w-full', layouts[props.layout], gaps[props.gap]]"><slot /></div>
  </div>
</template>
