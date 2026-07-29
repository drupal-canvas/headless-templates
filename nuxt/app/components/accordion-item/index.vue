<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, useId, watch } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  headingElement?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  defaultOpen?: boolean
  anchorId?: string
}>(), { headingElement: 'h3', defaultOpen: false })

const group = inject<{
  borderColor: 'gray_200' | 'gray_300' | 'gray_400' | 'primary_200' | 'primary_300'
  variant: 'default' | 'bordered' | 'separated'
}>('canvasAccordion', { borderColor: 'gray_200', variant: 'default' })
const itemRef = ref<HTMLElement | null>(null)
const isOpen = ref(props.defaultOpen)
const isFirstItem = ref(true)
const isLastItem = ref(true)
const safeId = useId().replace(/:/g, '')
const buttonId = `accordion-item-button-${safeId}`
const panelId = `accordion-item-panel-${safeId}`
const borderClasses = {
  gray_200: 'border-gray-200', gray_300: 'border-gray-300', gray_400: 'border-gray-400',
  primary_200: 'border-primary-200', primary_300: 'border-primary-300',
}
const itemClasses = computed(() => [
  'w-full',
  group.variant === 'bordered' && 'border bg-white',
  group.variant === 'bordered' && !isFirstItem.value && '-mt-px',
  group.variant === 'bordered' && isFirstItem.value && 'rounded-t-lg',
  group.variant === 'bordered' && isLastItem.value && 'rounded-b-lg',
  group.variant === 'separated' && 'rounded-xl border bg-white',
  (group.variant === 'bordered' || group.variant === 'separated') && borderClasses[group.borderColor],
])
const buttonClasses = computed(() => [
  'flex w-full items-center gap-3 text-left font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
  'focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
  group.variant === 'default' && 'justify-between py-4 text-base text-black hover:text-primary-700',
  group.variant === 'bordered' && 'px-5 py-4 text-base text-black hover:text-primary-700',
  group.variant === 'separated' && 'justify-between px-4 py-4 text-base text-black hover:text-primary-700',
])
const contentBodyClasses = computed(() => [
  'pb-4 text-gray-700',
  group.variant === 'bordered' && 'px-5',
  group.variant === 'separated' && 'px-4',
])

watch(() => props.defaultOpen, value => { isOpen.value = value })
const checkHash = () => {
  if (props.anchorId && window.location.hash === `#${props.anchorId}`) {
    isOpen.value = true
    requestAnimationFrame(() => requestAnimationFrame(() => itemRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })))
  }
}
onMounted(() => {
  const parent = itemRef.value?.closest('[data-accordion-group]')
  const items = Array.from(parent?.querySelectorAll('[data-accordion-item]') || [])
  const index = itemRef.value ? items.indexOf(itemRef.value) : -1
  isFirstItem.value = index === 0
  isLastItem.value = index === items.length - 1
  checkHash()
  window.addEventListener('hashchange', checkHash)
})
onUnmounted(() => window.removeEventListener('hashchange', checkHash))
</script>

<template>
  <div :id="props.anchorId" ref="itemRef" :class="itemClasses" data-accordion-item>
    <component :is="props.headingElement" class="m-0">
      <button
        :id="buttonId"
        type="button"
        :aria-controls="panelId"
        :aria-expanded="isOpen"
        :class="buttonClasses"
        data-accordion-button
        @click="isOpen = !isOpen"
      >
        <span v-if="group.variant === 'bordered'" class="relative inline-flex size-3.5 shrink-0 items-center justify-center">
          <svg v-show="!isOpen" aria-hidden="true" class="block size-3.5" fill="none" viewBox="0 0 24 24">
            <path d="M5 12h14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
            <path d="M12 5v14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
          </svg>
          <svg v-show="isOpen" aria-hidden="true" class="block size-3.5" fill="none" viewBox="0 0 24 24">
            <path d="M5 12h14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
          </svg>
        </span>
        <span>{{ props.title }}</span>
        <svg v-if="group.variant !== 'bordered'" aria-hidden="true" :class="['size-4 shrink-0 transition-transform duration-300', isOpen ? 'rotate-180' : 'rotate-0']" fill="none" viewBox="0 0 24 24">
          <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
        </svg>
      </button>
    </component>
    <div
      :id="panelId"
      :aria-hidden="!isOpen"
      :aria-labelledby="buttonId"
      :class="['grid w-full transition-[grid-template-rows] duration-300 ease-in-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]']"
      :inert="!isOpen"
      data-accordion-content
      role="region"
    >
      <div class="min-h-0 overflow-hidden">
        <div :class="contentBodyClasses"><slot name="content" /></div>
      </div>
    </div>
  </div>
</template>
