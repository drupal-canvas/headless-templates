<script setup lang="ts">
import Heading from '@/ui/Heading.vue'

withDefaults(defineProps<{
  preHeading?: string
  heading?: string
  textColor: 'dark' | 'light'
  headingElement: string
  headingSize: 'small' | 'medium' | 'large' | 'extra_large'
  layout: 'left_aligned' | 'center_aligned' | 'right_aligned'
}>(), { textColor: 'dark', headingElement: 'h2', headingSize: 'medium', layout: 'left_aligned' })
</script>

<template>
  <Heading :pre-heading="preHeading" :heading="heading" :text-color="textColor" :heading-element="headingElement" :heading-size="headingSize" :layout="layout" />
</template>
