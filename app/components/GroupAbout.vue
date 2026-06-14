<script setup lang="ts">
import type { Demographics } from '~/types/prayer'

const props = defineProps<{ demographics: Demographics }>()
const { t } = useI18n()

const population = computed(() =>
  props.demographics.population != null
    ? new Intl.NumberFormat('en-US').format(props.demographics.population)
    : null
)

// Condensed demographics — each fact keeps its icon but they flow inline and
// wrap to a line or two, rather than an icon-per-row table.
const facts = computed(() => {
  const d = props.demographics
  return [
    { icon: 'i-lucide-map-pin', value: d.country?.label },
    { icon: 'i-lucide-users', value: population.value },
    { icon: 'i-lucide-languages', value: d.language?.label },
    { icon: 'i-lucide-flame', value: d.religion?.label },
    { icon: 'i-lucide-target', value: d.status?.label },
    { icon: 'i-lucide-church', value: d.churches?.label }
  ].filter(f => f.value)
})

const researchUrl = computed(() => `https://doxa.life/research/${props.demographics.slug}/`)
</script>

<template>
  <div class="flex flex-col gap-4">
    <p
      v-if="demographics.description"
      class="text-sm leading-relaxed text-muted"
    >
      {{ demographics.description }}
    </p>

    <div class="text-sm">
      <div class="flex flex-wrap gap-x-4 gap-y-1.5">
        <span
          v-for="fact in facts"
          :key="fact.icon"
          class="inline-flex items-center gap-1.5 text-default"
        >
          <UIcon
            :name="fact.icon"
            class="text-primary text-base flex-none"
          />
          {{ fact.value }}
        </span>
      </div>
      <p
        v-if="demographics.far_from_jesus_pct != null"
        class="mt-3"
      >
        <span class="text-lg font-bold text-primary">{{ demographics.far_from_jesus_pct }}%</span>
        <span class="text-muted"> {{ t('pray.far_from_jesus') }}</span>
      </p>
    </div>

    <ULink
      :to="researchUrl"
      target="_blank"
      class="text-sm text-primary font-medium inline-flex items-center gap-1"
    >
      {{ t('pray.find_out_more') }}
      <UIcon
        name="i-lucide-external-link"
        class="text-xs"
      />
    </ULink>
  </div>
</template>
