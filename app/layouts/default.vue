<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

// On the prayer page the brand link doubles as a "back" affordance, matching
// the campaign pray pages.
const isPrayPage = computed(() => route.path.replace(/\/$/, '').endsWith('/pray'))
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Doxa green nav bar — brand links home, always reachable (e.g. during prayer) -->
    <header class="bg-primary text-white sticky top-0 z-50 shadow-sm">
      <div class="max-w-5xl mx-auto px-4">
        <div class="flex items-center justify-between h-14">
          <NuxtLink
            :to="localePath('/')"
            class="flex items-center gap-2 hover:opacity-90 transition-opacity"
            :aria-label="isPrayPage ? t('nav.back_home') : t('app.name')"
          >
            <UIcon
              :name="isPrayPage ? 'i-lucide-arrow-left' : 'i-lucide-globe'"
              class="text-xl"
            />
            <span class="font-heading text-2xl leading-none tracking-wide">{{ t('app.name') }}</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
