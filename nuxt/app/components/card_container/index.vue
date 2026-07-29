<script setup lang="ts">
import GridContainer from '@/ui/GridContainer.vue'
import Heading from '@/ui/Heading.vue'

const props = withDefaults(defineProps<{
  preHeading?: string, heading?: string, headingSize?: 'extra_large' | 'large' | 'medium' | 'small',
  textColor: 'dark' | 'light', headingPosition?: 'left_aligned' | 'center_aligned' | 'right_aligned', headingElement?: string, layout: string,
}>(), { headingSize: 'large', textColor: 'dark', headingPosition: 'center_aligned', headingElement: 'h2' })
</script>

<template>
  <div class="mx-6 flex flex-col items-center gap-16">
    <Heading
      v-if="props.heading"
      :heading="props.heading"
      :heading-element="props.headingElement"
      :heading-size="props.headingSize"
      :layout="props.headingPosition"
      :pre-heading="props.preHeading"
      :text-color="props.textColor"
    />
    <GridContainer :layout="props.layout">
      <slot name="content" />
    </GridContainer>
  </div>
</template>
