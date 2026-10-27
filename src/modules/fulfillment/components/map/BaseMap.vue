<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import maplibregl, {
  type AddLayerObject,
  type GeoJSONSource,
  type GeoJSONSourceSpecification,
  type Map as MapLibreMap,
  type Marker,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import MapPlaceholder from './MapPlaceholder.vue'
import type { LngLat } from '../../utils/deliveryAddress'
import type { DeliveryZone } from '../../api/delivery.service'

export interface MapMarker {
  id: string
  lngLat: LngLat
  active: boolean
  icon?: string
  title?: string
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

const ZONES_SOURCE = 'delivery-zones'

const props = withDefaults(
  defineProps<{
    center: LngLat
    zoom?: number
    pin?: boolean
    pinNote?: string | null
    markers?: MapMarker[]
    zones?: DeliveryZone[]
  }>(),
  { zoom: 17, pin: false, pinNote: null, markers: () => [], zones: () => [] },
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
  element.title = marker.title ?? ''
  element.innerHTML = `<i class="pi ${marker.icon ?? 'pi-shop'}"></i>`
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

function zonesData(): GeoJSONSourceSpecification['data'] {
  return {
    type: 'FeatureCollection',
    features: props.zones.map((zone) => ({
      type: 'Feature',
      id: zone.id,
      geometry: zone.polygon,
      properties: { color: zone.color, name: zone.name },
    })),
  }
}

function addZones() {
  map.value?.addSource(ZONES_SOURCE, { type: 'geojson', data: zonesData() })
  map.value?.addLayer({
    id: 'delivery-zones-fill',
    type: 'fill',
    source: ZONES_SOURCE,
    paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.12 },
  })
  map.value?.addLayer({
    id: 'delivery-zones-line',
    type: 'line',
    source: ZONES_SOURCE,
    paint: { 'line-color': ['get', 'color'], 'line-width': 2, 'line-opacity': 0.8 },
  })
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
    addZones()
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

watch(
  () => props.zones,
  () => map.value?.getSource<GeoJSONSource>(ZONES_SOURCE)?.setData(zonesData()),
)
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <div ref="container" class="h-full w-full [&_.maplibregl-ctrl-bottom-right]:bottom-[25px]!" />
    <MapPlaceholder v-if="!isLoaded" class="absolute inset-0" />
    <div
      v-if="pin && isLoaded"
      class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full transition-transform"
      :class="{ '-translate-y-[calc(100%+8px)]': isDragging }"
    >
      <span
        v-if="pinNote && !isDragging"
        class="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-950 px-3 py-1.5 text-xs font-semibold text-white shadow-md"
      >
        {{ pinNote }}
      </span>
      <i class="pi pi-map-marker text-4xl text-primary drop-shadow-md" />
    </div>
    <slot />
  </div>
</template>
