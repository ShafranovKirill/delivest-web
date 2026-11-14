<script setup lang="ts">
import { computed } from 'vue'
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

const props = withDefaults(
  defineProps<{
    city: string | null
    saved?: boolean
    zones?: DeliveryZone[]
    selectedZoneId?: string | null
  }>(),
  { saved: true, zones: () => [], selectedZoneId: null },
)

const emit = defineEmits<{ selecting: []; zoomTooLow: [] }>()

const address = defineModel<DeliveryAddress>({ required: true })

const branchStore = useBranchStore()
const franchiseStore = useFranchiseStore()
const hasMap = computed(() => franchiseStore.addressMap && branchStore.mapAddress)
const savedAddresses = useDeliveryAddresses()

const { mapCenter, isLocating, locate, isReady, pickSuggestion, pickSaved } = useAddressEditor(
  address,
  () => hasMap.value,
)

const markers = computed(() => (props.saved ? savedMarkers(savedAddresses.value) : []))

function pickMarker(id: string) {
  const saved = savedAddresses.value.find((address) => address.id === id)
  if (saved) pickSaved(saved)
}

function movePin(point: LngLat, zoom: number) {
  if (zoom < 15) emit('zoomTooLow')
  else locate(point, zoom)
}
</script>

<template>
  <div class="flex h-full flex-col">
    <BaseMap
      v-if="hasMap"
      :center="mapCenter"
      :markers="markers"
      :zones="zones"
      :selected-zone-id="selectedZoneId"
      pin
      class="min-h-48 flex-1"
      @moved="movePin"
      @drag-start="emit('selecting')"
      @marker-click="pickMarker"
    >
      <div class="absolute top-16 left-3 right-3 z-10 mx-auto max-w-xl">
        <slot name="summary" />
      </div>
      <SavedAddressesButton
        v-if="saved"
        class="absolute bottom-9 left-3 z-10"
        @select="pickSaved"
      />
    </BaseMap>

    <SheetPanel :floating="hasMap">
      <div class="flex flex-col gap-4">
        <slot v-if="!hasMap" name="summary" />
        <SavedAddresses v-if="saved && !hasMap" @select="pickSaved" />

        <slot name="before" />

        <DeliveryAddressForm
          v-model="address"
          :suggest="hasMap"
          :city="city"
          @select="pickSuggestion"
        />
      </div>

      <div class="flex flex-col gap-2 border-t border-gray-100 pt-4">
        <slot :ready="isReady" :locating="isLocating" />
      </div>
    </SheetPanel>
  </div>
</template>
