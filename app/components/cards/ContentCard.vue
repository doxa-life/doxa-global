<script setup lang="ts">
defineProps<{
  heading: string
  html: string
}>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm uppercase tracking-widest text-primary font-medium">
      {{ heading }}
    </p>
    <!-- Content is server-rendered from trusted, admin-authored library content
         and escaped by the server-side Tiptap renderer. -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="prayer-prose text-lg leading-relaxed text-default" v-html="html" />
  </div>
</template>
