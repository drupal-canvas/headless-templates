<script setup lang="ts">
import Button from '@/ui/Button.vue'
import Heading from '@/ui/Heading.vue'

interface Image { src: string, alt?: string, width?: number, height?: number }
const props = withDefaults(defineProps<{
  variant?: 'default' | 'link_card', image?: Image, layout: 'left_aligned' | 'center_aligned' | 'right_aligned',
  heading?: string, headingElement?: string, byline?: string, text?: string, link?: string, linkLabel?: string,
  linkVariant?: 'solid' | 'outline_dark' | 'link' | 'link_underline', backgroundColor?: string,
  backgroundColorOnHover?: string, textColor?: 'Default' | 'Dark' | 'Light',
}>(), {
  variant: 'default', layout: 'left_aligned', headingElement: 'h2', linkVariant: 'link',
  backgroundColor: '#ffffff', backgroundColorOnHover: '#E2E8F0', textColor: 'Default',
})
const align = { left_aligned: 'items-start text-left', center_aligned: 'items-center text-center', right_aligned: 'items-end text-right' }
const linkCardTextAlign = { left_aligned: 'text-left', center_aligned: 'text-center', right_aligned: 'text-right' }
const textColors = { Default: '', Dark: 'text-primary-dark', Light: 'text-white' }
</script>

<template>
  <a v-if="props.variant === 'link_card'" :href="props.link" class="group flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md focus:shadow-md focus:outline-none">
    <div class="p-4 md:p-5">
      <div class="flex items-center justify-between gap-x-3">
        <div class="flex grow items-center gap-x-3">
          <img v-if="props.image?.src" :src="props.image.src" :alt="props.image.alt || ''" :width="props.image.width" :height="props.image.height" class="size-9.5 rounded-full object-cover">
          <div :class="['grow', linkCardTextAlign[props.layout]]">
            <h3 class="font-semibold text-gray-800 group-hover:text-primary-600">{{ props.heading }}</h3>
            <p v-if="props.text" class="text-sm text-gray-500" v-html="props.text" />
          </div>
        </div>
        <svg class="size-5 shrink-0 text-gray-800" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </div>
  </a>
  <component :is="props.link && !props.linkLabel ? 'a' : 'div'" v-else :href="props.link && !props.linkLabel ? props.link : undefined">
    <div
      :class="[
        'flex w-full max-w-md flex-col items-center gap-4 rounded-2xl pb-6 leading-[normal] hover:bg-[var(--card-background-hover)]',
        align[props.layout], textColors[props.textColor], !props.image?.src && 'pt-8',
      ]"
      :style="{ backgroundColor: props.backgroundColor, '--card-background-hover': props.backgroundColorOnHover }"
    >
      <img v-if="props.image?.src" :src="props.image.src" :alt="props.image.alt || ''" :width="props.image.width" :height="props.image.height" class="w-full rounded-2xl object-cover object-center">
      <div class="px-6 pt-2">
        <Heading
          v-if="props.heading"
          class="mb-2"
          :heading="props.heading"
          :heading-element="props.headingElement"
          heading-size="small"
          :layout="props.layout"
          :text-color="props.textColor === 'Light' ? 'light' : 'dark'"
        />
        <div v-if="props.byline" class="mt-3 mb-2 text-xs font-semibold text-gray-500">{{ props.byline }}</div>
        <div v-if="props.text" class="mb-4 leading-6" v-html="props.text" />
        <Button v-if="props.link && props.linkLabel" :link="props.link" :text="props.linkLabel" :variant="props.linkVariant" />
      </div>
    </div>
  </component>
</template>
