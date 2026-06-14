<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

useHead({ title: 'Doxa Global' })

// Clicking a group on the map opens its detail modal (direct group selection).
const modalOpen = ref(false)
const selectedSlug = ref<string | null>(null)
function onSelect(slug: string) {
  selectedSlug.value = slug
  modalOpen.value = true
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
    <div class="max-w-xl flex flex-col items-center gap-8">
      <div class="flex items-center gap-2 text-primary">
        <UIcon
          name="i-lucide-globe"
          class="text-3xl"
        />
        <span class="text-xl font-semibold tracking-tight">{{ t('app.name') }}</span>
      </div>

      <h1 class="text-4xl sm:text-5xl font-bold text-highlighted leading-tight">
        {{ t('landing.tagline') }}
      </h1>

      <p class="text-lg text-muted leading-relaxed">
        {{ t('landing.intro') }}
      </p>

      <UButton
        :to="localePath('/pray')"
        color="primary"
        size="xl"
        trailing-icon="i-lucide-arrow-right"
      >
        {{ t('landing.start') }}
      </UButton>

      <div class="mt-8 w-full">
        <h2 class="text-sm uppercase tracking-widest text-muted mb-4">
          {{ t('landing.how_title') }}
        </h2>
        <ol class="flex flex-col gap-3 text-left">
          <li
            v-for="(step, i) in [t('landing.how_1'), t('landing.how_2'), t('landing.how_3')]"
            :key="i"
            class="flex items-start gap-3"
          >
            <span class="flex-none w-6 h-6 rounded-full bg-primary/15 text-primary text-sm font-semibold flex items-center justify-center">
              {{ i + 1 }}
            </span>
            <span class="text-default">{{ step }}</span>
          </li>
        </ol>
      </div>
    </div>

    <!-- Today's prayer coverage map -->
    <div class="mt-16 w-full max-w-4xl">
      <PrayerMap @select="onSelect" />
    </div>

    <GroupModal
      v-model:open="modalOpen"
      :slug="selectedSlug"
    />
  </div>
</template>
