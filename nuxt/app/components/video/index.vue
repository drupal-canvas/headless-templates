<script setup lang="ts">defineProps<{ video: { src: string, poster?: string } }>()</script>

<template>
  <video class="w-full" controls>
    <source :src="video.src"><track kind="captions">
  </video>
</template>
