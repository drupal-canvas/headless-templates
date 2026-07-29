<script setup lang="ts">
import TwoColumnText from '@/ui/TwoColumnText.vue'

interface Image { src: string, alt?: string, width?: number, height?: number }
withDefaults(defineProps<{
  image?: Image
  layout: 'text_image' | 'image_text'
  columnWidths: '33_66' | '50_50' | '66_33'
  preHeading?: string
  heading?: string
  headingElement: string
  headingSize: 'extra_large' | 'large' | 'medium' | 'small'
  text?: string
  textColor: 'dark' | 'light'
}>(), { layout: 'text_image', columnWidths: '50_50', headingElement: 'h2', headingSize: 'large', textColor: 'dark' })
</script>

<template>
  <TwoColumnText
    :image="image"
    :layout="layout"
    :column-widths="columnWidths"
    :pre-heading="preHeading"
    :heading="heading"
    :heading-element="headingElement"
    :heading-size="headingSize"
    :text="text"
    :text-color="textColor"
  >
    <template #buttons><slot name="buttons" /></template>
  </TwoColumnText>
</template>
