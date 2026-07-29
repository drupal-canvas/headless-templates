<script setup lang="ts">withDefaults(defineProps<{ width: 'normal' | 'wide' }>(), { width: 'normal' })</script>

<template>
  <section :class="['mx-auto my-8 px-4', width === 'wide' ? 'max-w-4xl' : 'max-w-2xl']"><slot name="content" /></section>
</template>
