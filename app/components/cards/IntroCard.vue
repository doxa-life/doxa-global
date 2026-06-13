<script setup lang="ts">
import type { Demographics } from '~/types/prayer'

const props = defineProps<{ demographics: Demographics }>()
const { t } = useI18n()

const creditText = computed(() =>
  (props.demographics.picture_credit ?? [])
    .map(c => c.text + (c.link ? '' : ''))
    .join('')
    .trim()
)
const creditLink = computed(() =>
  props.demographics.picture_credit?.find(c => c.link)?.link || null
)
</script>

<template>
  <div class="flex flex-col items-center text-center gap-5">
    <div class="relative">
      <div
        class="w-44 h-44 rounded-2xl overflow-hidden ring-4 ring-primary/15 bg-elevated flex items-center justify-center shadow-lg"
      >
        <img
          v-if="demographics.image_url"
          :src="demographics.image_url"
          :alt="demographics.name"
          class="w-full h-full object-cover"
        >
        <UIcon
          v-else
          name="i-lucide-users"
          class="text-5xl text-muted"
        />
      </div>
      <UPopover
        v-if="creditText"
        mode="hover"
      >
        <UButton
          icon="i-lucide-info"
          color="neutral"
          variant="solid"
          size="xs"
          class="absolute bottom-1.5 right-1.5 rounded-full opacity-80"
          :aria-label="t('pray.photo_credit')"
        />
        <template #content>
          <div class="p-3 text-xs max-w-56">
            <span>{{ creditText }}</span>
            <ULink
              v-if="creditLink"
              :to="creditLink"
              target="_blank"
              class="text-primary underline ml-1"
            >
              {{ creditLink.replace(/^https?:\/\//, '') }}
            </ULink>
          </div>
        </template>
      </UPopover>
    </div>

    <div>
      <p class="text-xs uppercase tracking-widest text-muted mb-1.5">
        {{ t('pray.pray_for') }}
      </p>
      <h1 class="text-3xl font-bold text-highlighted">
        {{ demographics.name }}
      </h1>
    </div>

    <p
      v-if="demographics.description"
      class="text-sm leading-relaxed text-muted max-h-48 overflow-y-auto"
    >
      {{ demographics.description }}
    </p>
  </div>
</template>
