<script setup lang="ts">
import Button from '@/ui/Button.vue'

withDefaults(defineProps<{ variant?: string, text: string, link?: string }>(), { variant: 'solid', link: '#' })
</script>

<template>
  <Button :variant="variant" :text="text" :link="link" />
</template>
