<script setup lang="ts">
import TwoColumnText from '@/ui/TwoColumnText.vue'

interface Image { src: string, alt?: string }
const props = withDefaults(defineProps<{
  backgroundImage: Image, layout: 'left_aligned' | 'centered', preHeading?: string, headingElement?: string,
  headingSize: 'extra_large' | 'large' | 'medium' | 'small', heading?: string, text?: string, textColor: 'dark' | 'light',
  darkenImage?: boolean,
}>(), { layout: 'left_aligned', headingElement: 'h2', headingSize: 'large', textColor: 'dark', darkenImage: false })
const nebulaLayout = props.layout as unknown as 'text_image'
</script>

<template>
  <div class="flex min-h-[672px] w-full justify-start bg-cover bg-center bg-no-repeat" :style="props.backgroundImage?.src ? { backgroundImage: `url(${props.backgroundImage.src})` } : undefined">
    <div :class="['align-center h-full w-full px-8 py-16', props.darkenImage && 'backdrop-brightness-75']">
      <TwoColumnText
        :layout="nebulaLayout"
        :pre-heading="props.preHeading"
        :heading="props.heading"
        :heading-element="props.headingElement"
        :heading-size="props.headingSize"
        :text="props.text"
        :text-color="props.textColor"
        text-shadow="medium"
      >
        <template #buttons><slot name="buttons" /></template>
      </TwoColumnText>
    </div>
  </div>
</template>
