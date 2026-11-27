<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseMap from '../map/BaseMap.vue'
import DeliveryAddressForm from './DeliveryAddressForm.vue'
import SavedAddresses from './SavedAddresses.vue'
import SavedAddressesButton from './SavedAddressesButton.vue'
import SheetPanel from '../SheetPanel.vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useAddressEditor } from '../../composables/useAddressEditor'
import { useDeliveryAddresses } from '../../composables/useDeliveryAddresses'
import { savedMarkers } from '../../utils/savedMarkers'
import type { DeliveryAddress, LngLat } from '../../utils/deliveryAddress'
import type { DeliveryZone } from '../../api/delivery.service'
import type { AddressNotice } from './addressNotice'

const props = withDefaults(
  defineProps<{
    city: string | null
    saved?: boolean
    zones?: DeliveryZone[]
    selectedZoneId?: string | null
    floatingLabels?: boolean
  }>(),
  { saved: true, zones: () => [], selectedZoneId: null, floatingLabels: false },
)

const emit = defineEmits<{ selecting: []; zoomTooLow: []; mapUnavailable: [] }>()

const address = defineModel<DeliveryAddress>({ required: true })
const { t } = useI18n()

const branchStore = useBranchStore()
const franchiseStore = useFranchiseStore()
const hasMap = computed(() => franchiseStore.addressMap && branchStore.mapAddress)
const mapAvailable = ref(true)
const showMap = computed(() => hasMap.value && mapAvailable.value)
const savedAddresses = useDeliveryAddresses()
const suggestionNotice = ref<AddressNotice | null>(null)

const {
  mapCenter,
  isLocating,
  notFound,
  locate,
  invalidate,
  startMoving,
  retryLocate,
  isReady,
  pickSuggestion,
  pickSaved,
} = useAddressEditor(address, () => branchStore.requiresCoordinates)
const notice = computed<AddressNotice | null>(() => {
  if (suggestionNotice.value) return suggestionNotice.value
  if (showMap.value && notFound.value)
    return { message: t('fulfillment.form.houseNotFound'), retry: retryLocate }
  return null
})

const markers = computed(() => (props.saved ? savedMarkers(savedAddresses.value) : []))

function pickMarker(id: string) {
  const saved = savedAddresses.value.find((address) => address.id === id)
  if (saved) pickSaved(saved)
}

function movePin(point: LngLat, zoom: number) {
  locate(point, zoom)
  if (zoom < 15) emit('zoomTooLow')
}

function dragStart() {
  startMoving()
  emit('selecting')
}

function mapUnavailable() {
  mapAvailable.value = false
  emit('mapUnavailable')
}
</script>

<template>
  <div class="flex h-full flex-col">
    <BaseMap
      v-if="showMap"
      :center="mapCenter"
      :markers="markers"
      :zones="zones"
      :selected-zone-id="selectedZoneId"
      pin
      class="min-h-48 flex-1"
      @moved="movePin"
      @drag-start="dragStart"
      @marker-click="pickMarker"
      @unavailable="mapUnavailable"
    >
      <SavedAddressesButton
        v-if="saved"
        :align-right="Boolean($slots['map-overlay'])"
        :class="
          $slots['map-overlay'] ? 'absolute bottom-9 right-3 z-10' : 'absolute bottom-9 left-3 z-10'
        "
        @select="pickSaved"
      />
      <template v-if="$slots['map-overlay']" #map-overlay>
        <slot name="map-overlay" :ready="isReady" :locating="isLocating" :notice="notice" />
      </template>
    </BaseMap>

    <SheetPanel :floating="showMap">
      <div class="flex flex-col gap-4">
        <SavedAddresses v-if="saved && !showMap" @select="pickSaved" />

        <slot name="before" />

        <DeliveryAddressForm
          v-model="address"
          :suggest="franchiseStore.addressMap"
          :manual="branchStore.mapAddress === false"
          :city="city"
          :floating-labels="floatingLabels"
          @select="pickSuggestion"
          @edit="invalidate"
          @notice="suggestionNotice = $event"
        />
      </div>

      <div class="flex flex-col gap-2 border-t border-gray-100 pt-4">
        <slot :ready="isReady" :locating="isLocating" :on-map="showMap" :notice="notice" />
      </div>
    </SheetPanel>
  </div>
</template>
