<script setup lang="ts">
const props = withDefaults(defineProps<{
  preHeading?: string
  heading?: string
  textColor?: 'dark' | 'light'
  headingElement?: string
  headingSize?: 'small' | 'medium' | 'large' | 'extra_large'
  layout?: 'left_aligned' | 'center_aligned' | 'right_aligned'
  textShadow?: 'light' | 'medium' | 'heavy'
}>(), { textColor: 'dark', headingElement: 'h2', headingSize: 'extra_large', layout: 'left_aligned' })
const sizes = { small: 'text-lg', medium: 'text-2xl', large: 'text-4xl', extra_large: 'text-6xl' }
const preHeadingSizes = { small: 'text-xs', medium: 'text-sm', large: 'text-base', extra_large: 'text-lg' }
const align = { left_aligned: 'items-start text-left', center_aligned: 'items-center text-center', right_aligned: 'items-end text-right' }
const shadows = { light: 'text-shadow-sm', medium: 'text-shadow-md', heavy: 'text-shadow-lg' }
</script>

<template>
  <div v-if="props.preHeading || props.heading" :class="['dark flex w-full flex-col', align[props.layout]]">
    <div v-if="props.preHeading" :class="['mb-4 font-bold', preHeadingSizes[props.headingSize], props.textColor === 'light' ? 'text-primary-light' : 'text-primary-dark', props.textShadow && shadows[props.textShadow]]">{{ props.preHeading }}</div>
    <component :is="props.headingElement" v-if="props.heading" :class="['leading-[normal] font-bold text-balance', sizes[props.headingSize], props.textColor === 'light' ? 'text-white' : 'text-black', props.textShadow && shadows[props.textShadow]]">{{ props.heading }}</component>
  </div>
</template>
