<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useMapStore } from '../stores/map.store'

interface Props {
  coordinates: [number, number]
  branchName?: string | null
  address?: string | null
}

const props = defineProps<Props>()
const mapStore = useMapStore()

const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: InstanceType<typeof window.ymaps.Map> | null = null

const initMap = async () => {
  if (!props.coordinates) return

  await nextTick()

  if (!mapContainer.value) return

  try {
    const ymaps = await mapStore.initYandexMapScript()

    if (mapInstance && typeof mapInstance.destroy === 'function') {
      mapInstance.destroy()
      mapInstance = null
    }

    if (!mapContainer.value) return

    mapInstance = new ymaps.Map(mapContainer.value, {
      center: props.coordinates,
      zoom: 16,
      controls: ['zoomControl', 'geolocationControl'],
    })

    const placemark = new ymaps.Placemark(
      props.coordinates,
      {
        balloonContent: `<strong>${props.branchName || ''}</strong><br>${props.address || ''}`,
      },
      { preset: 'islands#redIcon' },
    )

    mapInstance.geoObjects.add(placemark)
  } catch (error) {
    console.error('Ошибка инициализации карты:', error)
  }
}

onMounted(() => {
  initMap()
})

watch(
  () => props.coordinates,
  () => {
    initMap()
  },
  { flush: 'post', deep: true },
)
</script>

<template>
  <!-- Добавили mx-auto, box-border и гарантировали 100% ширину -->
  <div
    ref="mapContainer"
    class="w-full max-w-full h-87.5 rounded-xl overflow-hidden border border-gray-200 mx-auto box-border"
  ></div>
</template>
