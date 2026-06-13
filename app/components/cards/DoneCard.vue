<script setup lang="ts">
defineProps<{
  name: string
}>()
const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col items-center text-center gap-6">
    <div class="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
      <UIcon
        name="i-lucide-check"
        class="text-4xl text-primary"
      />
    </div>
    <div>
      <h2 class="text-2xl font-bold text-highlighted mb-2">
        {{ t('pray.done_title') }}
      </h2>
      <p class="text-muted">
        {{ t('pray.done_body', { name }) }}
      </p>
    </div>
  </div>
</template>
