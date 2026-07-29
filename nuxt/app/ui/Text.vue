<script setup lang="ts">
const props = withDefaults(defineProps<{
  text?: string
  textSize?: 'extra_small' | 'small' | 'normal' | 'large' | 'extra_large'
  textColor?: 'dark' | 'light'
  textShadow?: 'light' | 'medium' | 'heavy'
}>(), { textSize: 'normal', textColor: 'dark' })
const sizes = { extra_small: 'text-xs', small: 'text-sm', normal: 'text-base/6', large: 'text-lg/8', extra_large: 'text-xl/8' }
const shadows = { light: 'text-shadow-sm', medium: 'text-shadow-md', heavy: 'text-shadow-lg' }
</script>

<template>
  <div v-if="props.text" :class="['my-8', sizes[props.textSize], props.textColor === 'light' ? '!text-white' : '!text-black', props.textShadow && shadows[props.textShadow]]" v-html="props.text" />
</template>
