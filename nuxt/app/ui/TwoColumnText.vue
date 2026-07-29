<script setup lang="ts">
import Heading from '@/ui/Heading.vue'
import Text from '@/ui/Text.vue'

interface Image { src: string, alt?: string, width?: number, height?: number }
const props = withDefaults(defineProps<{
  image?: Image
  layout?: 'text_image' | 'image_text'
  columnWidths?: '33_66' | '50_50' | '66_33'
  preHeading?: string
  heading?: string
  headingElement?: string
  headingSize?: 'extra_large' | 'large' | 'medium' | 'small'
  text?: string
  textColor?: 'dark' | 'light'
  textShadow?: 'light' | 'medium' | 'heavy'
}>(), { layout: 'text_image', columnWidths: '50_50', headingElement: 'h2', headingSize: 'large', textColor: 'dark' })
const widths = { '33_66': ['md:w-1/3', 'md:w-2/3'], '50_50': ['md:w-1/2', 'md:w-1/2'], '66_33': ['md:w-2/3', 'md:w-1/3'] }
const layouts = { text_image: 'flex-col md:flex-row', image_text: 'flex-col md:flex-row-reverse' }
</script>

<template>
  <div class="flex w-full justify-start bg-cover bg-center bg-no-repeat py-24">
    <div class="mx-6 flex w-full items-center justify-center">
      <div :class="['mx-auto flex w-full max-w-[1360px] gap-8 md:items-center', layouts[props.layout]]">
        <div :class="['flex w-full flex-col items-start justify-center gap-4', widths[props.columnWidths][0]]">
          <div class="mb-4">
            <Heading :heading="props.heading" :heading-element="props.headingElement" :heading-size="props.headingSize" :pre-heading="props.preHeading" :text-color="props.textColor" :text-shadow="props.textShadow" />
          </div>
          <Text v-if="props.text" class="mb-4" :text="props.text" :text-color="props.textColor" text-size="large" :text-shadow="props.textShadow" />
          <div class="flex w-full min-w-3xs gap-4"><slot name="buttons" /></div>
        </div>
        <div :class="['flex w-full items-center', widths[props.columnWidths][1]]">
          <img v-if="props.image" :src="props.image.src" :alt="props.image.alt || ''" :width="props.image.width" :height="props.image.height" class="h-auto w-full">
        </div>
      </div>
    </div>
  </div>
</template>
