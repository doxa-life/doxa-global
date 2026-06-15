<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface TodayPoint { people_group_id: number, count: number }
interface TodayData {
  points: TodayPoint[]
  group_count: number
  prayer_count: number
  total_groups: number
  prayed_total: number
}

const { t } = useI18n()
const config = useRuntimeConfig()

const emit = defineEmits<{ (e: 'select', slug: string): void }>()

// doxa.life prayer-map palette (1040-maps prayer-progress.js):
// red = needs prayer, green = prayed for (today, here).
const COLOR_NEEDS = '#e74c3c' // red — not prayed for today
const COLOR_PRAYED = '#22c55e' // green — prayed for today

// Zoom interpolations lifted from doxa's 1040-maps zoom.js ("standard").
const RADIUS: mapboxgl.ExpressionSpecification = [
  'interpolate', ['linear'], ['zoom'],
  0, 3, 2, 3.5, 4, 4, 5, 5, 6, 6.5, 7, 8, 8, 10, 10, 14, 12, 18, 14, 22
]
const STROKE_WIDTH: mapboxgl.ExpressionSpecification = [
  'interpolate', ['linear'], ['zoom'], 0, 0.5, 4, 0.75, 8, 1, 12, 1.5
]
const GLOW_RADIUS: mapboxgl.ExpressionSpecification = [
  'interpolate', ['linear'], ['zoom'],
  0, 4.4, 2, 5, 4, 6, 5, 7, 6, 9, 7, 11, 8, 14, 10, 20, 12, 26, 14, 32
]

// True when a group has been prayed for today (live feature-state, falling back
// to the count baked into the GeoJSON on first load).
const PRAYED: mapboxgl.ExpressionSpecification = [
  '>', ['coalesce', ['feature-state', 'prayed'], ['get', 'prayed'], 0], 0
]

const mapEl = ref<HTMLElement | null>(null)
const summary = ref({ group_count: 0, prayer_count: 0, total_groups: 0, prayed_total: 0 })
const loaded = ref(false)

const progressPct = computed(() =>
  summary.value.total_groups > 0
    ? Math.round((summary.value.group_count / summary.value.total_groups) * 100)
    : 0
)
const numberFmt = new Intl.NumberFormat('en-US')
let map: mapboxgl.Map | null = null
let raf = 0
let pollTimer: ReturnType<typeof setInterval> | null = null

function applyToday(data: TodayData) {
  summary.value = {
    group_count: data.group_count,
    prayer_count: data.prayer_count,
    total_groups: data.total_groups,
    prayed_total: data.prayed_total
  }
  if (!map) return
  for (const p of data.points) {
    map.setFeatureState({ source: 'groups', id: p.people_group_id }, { prayed: p.count })
  }
}

async function pollToday() {
  try {
    applyToday(await $fetch<TodayData>('/api/map/today'))
  } catch (err) {
    console.error('Failed to refresh prayer map:', err)
  }
}

// Gentle breathing glow on prayed pins — re-set the glow opacity each frame with
// a sine wave (matches doxa's ~6s ripple cadence). Non-prayed pins stay at 0.
function animateGlow(startMs: number) {
  if (!map) return
  const phase = ((performance.now() - startMs) % 6000) / 6000
  const opacity = 0.12 + 0.28 * (0.5 - 0.5 * Math.cos(phase * 2 * Math.PI))
  map.setPaintProperty('groups-glow', 'circle-opacity', [
    'case', PRAYED, opacity, 0
  ] as mapboxgl.ExpressionSpecification)
  raf = requestAnimationFrame(() => animateGlow(startMs))
}

onMounted(async () => {
  await nextTick()
  if (!mapEl.value) return

  mapboxgl.accessToken = config.public.mapboxToken as string

  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/light-v11',
    projection: 'mercator',
    center: [20, 20],
    zoom: 1.2,
    minZoom: 0.5,
    maxZoom: 18,
    attributionControl: false,
    cooperativeGestures: true
  })
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left')
  map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

  const geojson = await $fetch<GeoJSON.FeatureCollection>('/api/map/groups')

  map.on('load', () => {
    if (!map) return
    map.addSource('groups', { type: 'geojson', data: geojson as never })

    // Glow (below everything) — green halo, blurred; opacity animated, 0 unless prayed.
    map.addLayer({
      id: 'groups-glow',
      type: 'circle',
      source: 'groups',
      paint: {
        'circle-radius': GLOW_RADIUS,
        'circle-color': COLOR_PRAYED,
        'circle-blur': 0.9,
        'circle-opacity': ['case', PRAYED, 0.25, 0] as mapboxgl.ExpressionSpecification
      }
    })

    // Soft drop shadow for depth (doxa's shadow layer).
    map.addLayer({
      id: 'groups-shadow',
      type: 'circle',
      source: 'groups',
      paint: {
        'circle-radius': RADIUS,
        'circle-color': 'rgba(0,0,0,0.12)',
        'circle-blur': 0.8,
        'circle-translate': [0, 1]
      }
    })

    // Base pins — red by default, green once prayed for today.
    map.addLayer({
      id: 'groups-base',
      type: 'circle',
      source: 'groups',
      paint: {
        'circle-radius': RADIUS,
        'circle-color': ['case', PRAYED, COLOR_PRAYED, COLOR_NEEDS] as mapboxgl.ExpressionSpecification,
        'circle-stroke-width': STROKE_WIDTH,
        'circle-stroke-color': 'rgba(0,0,0,0.45)',
        'circle-opacity': 1
      }
    })

    // Hover tooltip
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 8 })
    map.on('mousemove', 'groups-base', (e) => {
      if (!map || !e.features?.length) return
      map.getCanvas().style.cursor = 'pointer'
      const f = e.features[0]!
      const props = f.properties as { name: string, prayed: number }
      const state = (map.getFeatureState({ source: 'groups', id: f.id as number }) as { prayed?: number })
      const count = state.prayed ?? props.prayed ?? 0
      const label = count > 0 ? `${props.name} — ${t('landing.map.times', count)}` : props.name
      popup.setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number]).setHTML(
        `<div style="font-size:12px;font-weight:500">${label}</div>`
      ).addTo(map)
    })
    map.on('mouseleave', 'groups-base', () => {
      if (map) map.getCanvas().style.cursor = ''
      popup.remove()
    })

    // Click a pin to open its people-group detail (choose-your-own group).
    map.on('click', 'groups-base', (e) => {
      const f = e.features?.[0]
      const slug = (f?.properties as { slug?: string } | undefined)?.slug
      if (slug) emit('select', slug)
    })

    raf = requestAnimationFrame(() => animateGlow(performance.now()))
    void pollToday()
    pollTimer = setInterval(pollToday, 12_000)
    loaded.value = true
  })
})

onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf)
  if (pollTimer) clearInterval(pollTimer)
  map?.remove()
  map = null
})
</script>

<template>
  <div class="w-full">
    <!-- Overall progress across all people groups -->
    <div
      v-if="loaded"
      class="mb-4"
    >
      <div class="flex items-baseline justify-between mb-1.5">
        <p class="text-sm text-default">
          <span class="font-semibold text-highlighted">{{ numberFmt.format(summary.group_count) }}</span>
          {{ t('landing.map.progress', { total: numberFmt.format(summary.total_groups) }) }}
        </p>
        <p class="text-sm font-semibold text-primary">
          {{ progressPct }}%
        </p>
      </div>
      <div class="h-2 rounded-full bg-elevated overflow-hidden">
        <div
          class="h-full bg-primary rounded-full transition-all duration-500"
          :style="{ width: `${progressPct}%` }"
        />
      </div>
    </div>

    <div class="flex items-baseline justify-between mb-3">
      <h2 class="text-sm uppercase tracking-widest text-muted">
        {{ t('landing.map.title') }}
      </h2>
      <p
        v-if="loaded"
        class="text-sm text-muted"
      >
        {{ t('landing.map.summary', { groups: summary.group_count, prayers: summary.prayer_count }) }}
      </p>
    </div>
    <div
      ref="mapEl"
      class="w-full h-80 sm:h-[28rem] rounded-2xl overflow-hidden border border-default"
    />
  </div>
</template>
