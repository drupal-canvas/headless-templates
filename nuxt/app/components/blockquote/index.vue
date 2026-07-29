<script setup lang="ts">
withDefaults(defineProps<{ text?: string, textColor: 'dark' | 'light', name?: string, title?: string }>(), { textColor: 'dark' })
</script>

<template>
  <div :class="['my-8 flex w-full flex-col leading-[normal]', textColor === 'light' && 'text-white']">
    <div class="flex grow justify-center gap-6">
      <div class="w-1 bg-gray-200" />
      <div class="grow font-medium">
        <div v-if="text" class="flex items-start self-stretch text-xl leading-8" v-html="text" />
        <div v-if="name" class="flex items-end self-stretch pt-5 leading-6 font-bold whitespace-pre-wrap">{{ name }}</div>
        <div v-if="title" :class="['text-sm leading-5 whitespace-pre-wrap', textColor === 'light' ? 'text-gray-200' : 'text-gray-500']">{{ title }}</div>
      </div>
    </div>
  </div>
</template>
