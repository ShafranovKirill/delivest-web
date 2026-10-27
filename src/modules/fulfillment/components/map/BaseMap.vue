<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import maplibregl, { type AddLayerObject, type Map as MapLibreMap, type Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import MapPlaceholder from './MapPlaceholder.vue'
import type { LngLat } from '../../utils/deliveryAddress'

export interface MapMarker {
  id: string
  lngLat: LngLat
  active: boolean
}

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

const BLANK_IMAGE = { width: 1, height: 1, data: new Uint8Array(4) }

const HOUSE_NUMBERS: AddLayerObject = {
  id: 'house-numbers',
  type: 'symbol',
  source: 'openmaptiles',
  'source-layer': 'housenumber',
  minzoom: 16,
  layout: {
    'text-field': ['get', 'housenumber'],
    'text-font': ['Noto Sans Regular'],
    'text-size': 12,
  },
  paint: { 'text-color': '#4b5563', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
}

const props = withDefaults(
  defineProps<{
    center: LngLat
    zoom?: number
    pin?: boolean
    markers?: MapMarker[]
  }>(),
  { zoom: 17, pin: false, markers: () => [] },
)

const emit = defineEmits<{
  moved: [center: LngLat, zoom: number]
  markerClick: [id: string]
}>()

const container = ref<HTMLDivElement | null>(null)
const map = shallowRef<MapLibreMap | null>(null)
const isDragging = ref(false)
const isLoaded = ref(false)
let rendered: Marker[] = []

function markerElement(marker: MapMarker) {
  const element = document.createElement('button')
  element.type = 'button'
  element.className = [
    'grid place-items-center size-10 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform',
    marker.active ? 'bg-primary text-white scale-125' : 'bg-white text-primary',
  ].join(' ')
  element.innerHTML = '<i class="pi pi-shop"></i>'
  element.addEventListener('click', () => emit('markerClick', marker.id))
  return element
}

function renderMarkers() {
  rendered.forEach((marker) => marker.remove())
  rendered = props.markers.map((marker) =>
    new maplibregl.Marker({ element: markerElement(marker) })
      .setLngLat(marker.lngLat)
      .addTo(map.value!),
  )
}

onMounted(() => {
  map.value = new maplibregl.Map({
    container: container.value!,
    style: STYLE_URL,
    center: props.center,
    zoom: props.zoom,
    attributionControl: { compact: true },
  })

  map.value.on('load', () => {
    map.value?.addLayer(HOUSE_NUMBERS)
    isLoaded.value = true
  })
  map.value.on('styleimagemissing', ({ id }) => map.value?.addImage(id, BLANK_IMAGE))
  map.value.on('dragstart', () => (isDragging.value = true))
  map.value.on('moveend', (event) => {
    isDragging.value = false
    if (!event.originalEvent) return
    const { lng, lat } = map.value!.getCenter()
    emit('moved', [lng, lat], map.value!.getZoom())
  })

  renderMarkers()
})

useResizeObserver(container, () => map.value?.resize())

onBeforeUnmount(() => map.value?.remove())

watch(
  () => props.center,
  (center) => map.value?.flyTo({ center, zoom: Math.max(map.value.getZoom(), props.zoom) }),
)

watch(() => props.markers, renderMarkers, { deep: true })
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <div ref="container" class="h-full w-full" />
    <MapPlaceholder v-if="!isLoaded" class="absolute inset-0" />
    <div
      v-if="pin && isLoaded"
      class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full transition-transform"
      :class="{ '-translate-y-[calc(100%+8px)]': isDragging }"
    >
      <i class="pi pi-map-marker text-4xl text-primary drop-shadow-md" />
    </div>
  </div>
</template>
