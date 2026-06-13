<script setup lang="ts">
import type { Demographics } from '~/types/prayer'

export interface StackCard {
  type: 'intro' | 'demographics' | 'content' | 'done'
  name?: string
  demographics?: Demographics
  heading?: string
  html?: string
}

const props = defineProps<{ cards: StackCard[] }>()
const emit = defineEmits<{
  (e: 'complete' | 'restart'): void
}>()

const { t } = useI18n()

const index = ref(0)
const completedFired = ref(false)

const current = computed(() => props.cards[index.value])
const isLast = computed(() => index.value === props.cards.length - 1)
const isFirst = computed(() => index.value === 0)

// Fire `complete` exactly once, when the final (done) card is reached. This is
// the count point — it catches people who pray through and then close the tab
// without tapping "pray for another".
watch(index, (i) => {
  if (i === props.cards.length - 1 && !completedFired.value) {
    completedFired.value = true
    emit('complete')
  }
})

function next() {
  if (!isLast.value) index.value++
}
function prev() {
  if (!isFirst.value) index.value--
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
}

// Touch swipe
let touchStartX = 0
function onTouchStart(e: TouchEvent) {
  touchStartX = e.changedTouches[0]!.screenX
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0]!.screenX - touchStartX
  if (Math.abs(dx) < 40) return
  if (dx < 0) next()
  else prev()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    class="w-full max-w-md mx-auto flex flex-col gap-6"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- Progress dots -->
    <div class="flex justify-center gap-2">
      <span
        v-for="(c, i) in cards"
        :key="i"
        class="h-1.5 rounded-full transition-all duration-300"
        :class="i === index ? 'w-6 bg-primary' : 'w-1.5 bg-muted/40'"
      />
    </div>

    <!-- Card body -->
    <UCard
      class="min-h-[24rem] flex"
      :ui="{ body: 'flex-1 flex flex-col justify-center' }"
    >
      <Transition
        name="card"
        mode="out-in"
      >
        <div :key="index">
          <CardsIntroCard
            v-if="current?.type === 'intro'"
            :demographics="current.demographics!"
          />
          <CardsDemographicsCard
            v-else-if="current?.type === 'demographics'"
            :demographics="current.demographics!"
          />
          <CardsContentCard
            v-else-if="current?.type === 'content'"
            :heading="current.heading!"
            :html="current.html!"
          />
          <CardsDoneCard
            v-else-if="current?.type === 'done'"
            :name="current.name!"
          />
        </div>
      </Transition>
    </UCard>

    <!-- Controls -->
    <div class="flex items-center justify-between gap-3">
      <UButton
        v-if="!isFirst && !isLast"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        :aria-label="'back'"
        @click="prev"
      />
      <div
        v-else
        class="w-9"
      />

      <UButton
        v-if="isFirst"
        color="primary"
        size="lg"
        trailing-icon="i-lucide-arrow-right"
        class="flex-1 justify-center"
        @click="next"
      >
        {{ t('pray.begin') }}
      </UButton>
      <UButton
        v-else-if="!isLast"
        color="primary"
        size="lg"
        trailing-icon="i-lucide-arrow-right"
        class="flex-1 justify-center"
        @click="next"
      >
        {{ t('pray.next') }}
      </UButton>
      <UButton
        v-else
        color="primary"
        size="lg"
        icon="i-lucide-refresh-cw"
        class="flex-1 justify-center"
        @click="emit('restart')"
      >
        {{ t('pray.pray_another') }}
      </UButton>

      <div class="w-9" />
    </div>
  </div>
</template>

<style scoped>
.card-enter-active,
.card-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.card-enter-from {
  opacity: 0;
  transform: translateX(12px);
}
.card-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
