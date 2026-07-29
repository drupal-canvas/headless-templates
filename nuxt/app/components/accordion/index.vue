<script setup lang="ts">
import { provide, useId } from 'vue'

const props = withDefaults(defineProps<{
  borderColor?: 'gray_200' | 'gray_300' | 'gray_400' | 'primary_200' | 'primary_300'
  variant?: 'default' | 'bordered' | 'separated'
}>(), { borderColor: 'gray_200', variant: 'default' })

const borders = {
  gray_200: 'divide-y divide-gray-200', gray_300: 'divide-y divide-gray-300', gray_400: 'divide-y divide-gray-400',
  primary_200: 'divide-y divide-primary-200', primary_300: 'divide-y divide-primary-300',
}
provide('canvasAccordion', props)
const groupId = useId().replace(/:/g, '')
</script>

<template>
  <div
    :class="['w-full', props.variant === 'separated' && 'flex flex-col gap-2', props.variant === 'default' && borders[props.borderColor]]"
    data-accordion-group
    :data-accordion-group-id="groupId"
    :data-border-color="props.borderColor"
    :data-variant="props.variant"
  >
    <slot name="items" />
  </div>
</template>
