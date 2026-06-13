<script setup lang="ts">
import type { StackCard } from '~/components/CardStack.vue'
import type { NextGroup, SessionBundle } from '~/types/prayer'

const { t } = useI18n()
useHead({ title: 'Pray — Doxa Global' })

const status = ref<'loading' | 'ready' | 'error'>('loading')
const cards = ref<StackCard[]>([])
const current = ref<{ group: NextGroup, sessionId: string } | null>(null)
const stackKey = ref(0)

let trackingId = ''
const startedAt = ref(0)

function buildCards(group: NextGroup, bundle: SessionBundle): StackCard[] {
  const demo = bundle.demographics
  const out: StackCard[] = [
    { type: 'intro', demographics: demo },
    { type: 'demographics', demographics: demo }
  ]
  if (bundle.day_in_life) {
    out.push({ type: 'content', heading: t('pray.day_in_life_title'), html: bundle.day_in_life.html })
  }
  for (const piece of bundle.pray_more) {
    out.push({ type: 'content', heading: piece.title || t('pray.scripture_title'), html: piece.html })
  }
  out.push({ type: 'done', name: demo.name })
  return out
}

async function loadNext() {
  status.value = 'loading'
  try {
    const group = await $fetch<NextGroup>('/api/groups/next')
    const bundle = await $fetch<SessionBundle>(`/api/groups/${encodeURIComponent(group.slug)}/session`, {
      query: { locale: 'en' }
    })
    current.value = { group, sessionId: newSessionId() }
    startedAt.value = Date.now()
    cards.value = buildCards(group, bundle)
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
        people_group_id: current.value.group.people_group_id,
        duration
      }
    })
  } catch (err) {
    console.error('Failed to record prayer:', err)
  }
}

function onRestart() {
  loadNext()
}

onMounted(async () => {
  trackingId = useTrackingId()
  await loadNext()
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
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
        @click="loadNext"
      >
        {{ t('pray.retry') }}
      </UButton>
    </div>

    <!-- Card stack -->
    <CardStack
      v-else
      :key="stackKey"
      :cards="cards"
      @complete="onComplete"
      @restart="onRestart"
    />
  </div>
</template>
