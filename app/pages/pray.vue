<script setup lang="ts">
import type { StackCard } from '~/components/CardStack.vue'
import type { NextGroup, SessionBundle } from '~/types/prayer'

const { t } = useI18n()
const route = useRoute()
useHead({ title: 'Pray — Doxa Global' })

const status = ref<'loading' | 'ready' | 'error'>('loading')
const cards = ref<StackCard[]>([])
const current = ref<{ slug: string, peopleGroupId: number, sessionId: string } | null>(null)
const stackKey = ref(0)

let trackingId = ''
const startedAt = ref(0)

const header = ref<{ name: string, imageUrl: string | null, slug: string }>({ name: '', imageUrl: null, slug: '' })

function buildCards(bundle: SessionBundle): StackCard[] {
  const demo = bundle.demographics
  // Merged "about" card: description + condensed demographics in one place.
  const out: StackCard[] = [
    { type: 'about', demographics: demo }
  ]
  if (bundle.day_in_life) {
    out.push({ type: 'content', heading: t('pray.day_in_life_title'), html: bundle.day_in_life.html })
  }
  for (const piece of bundle.pray_more) {
    out.push({ type: 'content', heading: piece.title || t('pray.scripture_title'), html: piece.html })
  }
  out.push({ type: 'done' })
  return out
}

// Load a specific people group when `slug` is given (chosen from the map),
// otherwise ask the server for the next least-prayed group.
async function loadGroup(slug?: string) {
  status.value = 'loading'
  try {
    let targetSlug = slug
    if (!targetSlug) {
      const next = await $fetch<NextGroup>('/api/groups/next')
      targetSlug = next.slug
    }
    const bundle = await $fetch<SessionBundle>(`/api/groups/${encodeURIComponent(targetSlug)}/session`, {
      query: { locale: 'en' }
    })
    current.value = {
      slug: targetSlug,
      peopleGroupId: bundle.demographics.id,
      sessionId: newSessionId()
    }
    header.value = {
      name: bundle.demographics.name,
      imageUrl: bundle.demographics.image_url,
      slug: bundle.demographics.slug
    }
    startedAt.value = Date.now()
    cards.value = buildCards(bundle)
    stackKey.value++
    status.value = 'ready'
  } catch (err) {
    console.error('Failed to load prayer session:', err)
    status.value = 'error'
  }
}

async function onComplete() {
  if (!current.value) return
  const duration = Math.round((Date.now() - startedAt.value) / 1000)
  try {
    await $fetch('/api/prayed', {
      method: 'POST',
      body: {
        session_id: current.value.sessionId,
        tracking_id: trackingId,
        people_group_id: current.value.peopleGroupId,
        duration
      }
    })
  } catch (err) {
    console.error('Failed to record prayer:', err)
  }
}

// "Pray for another" always moves on to a random least-prayed group.
function onRestart() {
  loadGroup()
}

onMounted(async () => {
  trackingId = useTrackingId()
  const requested = typeof route.query.group === 'string' ? route.query.group : undefined
  await loadGroup(requested)
})
</script>

<template>
  <div class="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-12">
    <!-- Loading -->
    <div
      v-if="status === 'loading'"
      class="flex flex-col items-center gap-4 text-muted"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="text-3xl animate-spin text-primary"
      />
      <p>{{ t('pray.loading') }}</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="status === 'error'"
      class="flex flex-col items-center gap-4 text-center"
    >
      <UIcon
        name="i-lucide-circle-alert"
        class="text-3xl text-error"
      />
      <p class="text-muted">
        {{ t('pray.error') }}
      </p>
      <UButton
        color="primary"
        @click="loadGroup()"
      >
        {{ t('pray.retry') }}
      </UButton>
    </div>

    <!-- Card stack -->
    <CardStack
      v-else
      :key="stackKey"
      :cards="cards"
      :group="header"
      @complete="onComplete"
      @restart="onRestart"
    />
  </div>
</template>
