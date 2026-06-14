<script setup lang="ts">
// Small square people-group image + name. Persistent header on every prayer
// card and reused in the map modal — mirrors pray.doxa.life's prayer page.
defineProps<{
  name: string
  imageUrl?: string | null
}>()
const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="w-14 h-14 rounded-lg overflow-hidden bg-elevated flex items-center justify-center flex-none ring-1 ring-default">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="name"
        class="w-full h-full object-cover"
      >
      <UIcon
        v-else
        name="i-lucide-users"
        class="text-2xl text-muted"
      />
    </div>
    <div class="min-w-0">
      <p class="text-[0.7rem] uppercase tracking-widest text-muted leading-none mb-1">
        {{ t('pray.pray_for') }}
      </p>
      <h2 class="font-heading text-3xl leading-none text-highlighted truncate">
        {{ name }}
      </h2>
    </div>
  </div>
</template>
