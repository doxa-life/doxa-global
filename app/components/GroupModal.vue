<script setup lang="ts">
import type { Demographics, SessionBundle } from '~/types/prayer'

const props = defineProps<{ slug: string | null }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const localePath = useLocalePath()

const loading = ref(false)
const demographics = ref<Demographics | null>(null)

// Fetch the chosen group's info when the modal opens (or the slug changes).
watch([open, () => props.slug], async ([isOpen, slug]) => {
  if (!isOpen || !slug) return
  if (demographics.value?.slug === slug) return
  loading.value = true
  demographics.value = null
  try {
    const bundle = await $fetch<SessionBundle>(`/api/groups/${encodeURIComponent(slug)}/session`, {
      query: { locale: 'en' }
    })
    demographics.value = bundle.demographics
  } catch (err) {
    console.error('Failed to load people group:', err)
  } finally {
    loading.value = false
  }
})

function startPraying() {
  if (!props.slug) return
  open.value = false
  navigateTo(localePath({ path: '/pray', query: { group: props.slug } }))
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="demographics?.name ?? ''"
    :ui="{ content: 'max-w-lg', title: 'sr-only' }"
  >
    <template #body>
      <div
        v-if="loading"
        class="py-12 flex justify-center"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="text-3xl animate-spin text-primary"
        />
      </div>

      <div
        v-else-if="demographics"
        class="flex flex-col gap-5"
      >
        <GroupHeader
          :name="demographics.name"
          :image-url="demographics.image_url"
        />

        <GroupAbout :demographics="demographics" />

        <UButton
          color="primary"
          size="lg"
          icon="i-lucide-hand-heart"
          block
          @click="startPraying"
        >
          {{ t('pray.pray_for_this', { name: demographics.name }) }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
