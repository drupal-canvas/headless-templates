<script setup lang="ts">
import GridContainer from '@/ui/GridContainer.vue'

withDefaults(defineProps<{
  layout: string
  gap?: 'extra_small' | 'small' | 'medium' | 'large' | 'extra_large'
}>(), { layout: '33-33-33', gap: 'medium' })
</script>

<template>
  <GridContainer :layout="layout" :gap="gap"><slot name="content" /></GridContainer>
</template>
