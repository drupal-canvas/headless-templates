<script setup lang="ts">
import Text from '@/ui/Text.vue'

withDefaults(defineProps<{
  text?: string
  textSize: 'extra_small' | 'small' | 'normal' | 'large' | 'extra_large'
  textColor: 'dark' | 'light'
}>(), { textSize: 'normal', textColor: 'dark' })
</script>

<template>
  <Text :text="text" :text-size="textSize" :text-color="textColor" />
</template>
