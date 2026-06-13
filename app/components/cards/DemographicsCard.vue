<script setup lang="ts">
import type { Demographics } from '~/types/prayer'

const props = defineProps<{ demographics: Demographics }>()
const { t } = useI18n()

const formattedPopulation = computed(() =>
  props.demographics.population != null
    ? new Intl.NumberFormat('en-US').format(props.demographics.population)
    : null
)

// Overview rows mirror pray.doxa.life's "Overview" block (icon + label + value).
const rows = computed(() => {
  const d = props.demographics
  return [
    { icon: 'i-lucide-map-pin', label: t('pray.country'), value: d.country?.label },
    { icon: 'i-lucide-users', label: t('pray.population'), value: formattedPopulation.value },
    { icon: 'i-lucide-languages', label: t('pray.language'), value: d.language?.label },
    { icon: 'i-lucide-flame', label: t('pray.religion'), value: d.religion?.label },
    { icon: 'i-lucide-target', label: t('pray.status'), value: d.status?.label },
    { icon: 'i-lucide-church', label: t('pray.churches'), value: d.churches?.label }
  ].filter(r => r.value)
})

const mapSrc = computed(() => {
  const { latitude: lat, longitude: lng } = props.demographics
  if (lat == null || lng == null) return null
  const d = 2
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
})

const researchUrl = computed(() => `https://doxa.life/research/${props.demographics.slug}/`)
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex items-center justify-between">
      <h2 class="text-xs uppercase tracking-widest text-muted font-semibold">
        {{ t('pray.overview') }}
      </h2>
      <div
        v-if="demographics.far_from_jesus_pct != null"
        class="text-right"
      >
        <span class="text-2xl font-bold text-primary">{{ demographics.far_from_jesus_pct }}%</span>
        <span class="block text-[0.65rem] uppercase tracking-wide text-muted leading-tight">
          {{ t('pray.far_from_jesus') }}
        </span>
      </div>
    </div>

    <dl class="flex flex-col">
      <div
        v-for="row in rows"
        :key="row.label"
        class="flex items-center gap-3 py-2.5 border-b border-default last:border-0"
      >
        <UIcon
          :name="row.icon"
          class="text-primary text-lg flex-none"
        />
        <dt class="text-muted text-sm flex-none w-24">
          {{ row.label }}
        </dt>
        <dd class="font-medium text-highlighted text-sm text-right flex-1">
          {{ row.value }}
        </dd>
      </div>
    </dl>

    <div
      v-if="mapSrc"
      class="rounded-xl overflow-hidden border border-default"
    >
      <iframe
        :src="mapSrc"
        class="w-full h-40"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        :title="`Map of ${demographics.name}`"
      />
    </div>

    <UButton
      :to="researchUrl"
      target="_blank"
      color="neutral"
      variant="outline"
      trailing-icon="i-lucide-external-link"
      block
    >
      {{ t('pray.find_out_more') }}
    </UButton>
  </div>
</template>
