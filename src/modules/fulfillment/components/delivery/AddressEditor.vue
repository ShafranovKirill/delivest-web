<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseMap from '../map/BaseMap.vue'
import DeliveryAddressForm from './DeliveryAddressForm.vue'
import SavedAddresses from './SavedAddresses.vue'
import SavedAddressesButton from './SavedAddressesButton.vue'
import SheetPanel from '../SheetPanel.vue'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useAddressEditor } from '../../composables/useAddressEditor'
import { useCityAddresses } from '../../composables/useCityAddresses'
import { savedMarkers } from '../../utils/savedMarkers'
import type { DeliveryAddress } from '../../utils/deliveryAddress'
import type { DeliveryZone } from '../../api/delivery.service'

const props = withDefaults(
  defineProps<{
    city: string | null
    saved?: boolean
    zones?: DeliveryZone[]
    pinNote?: string | null
  }>(),
  { saved: true, zones: () => [], pinNote: null },
)

const address = defineModel<DeliveryAddress>({ required: true })

const { t } = useI18n()
const franchiseStore = useFranchiseStore()
const savedAddresses = useCityAddresses(() => props.city)

const { mapCenter, isLocating, locate, outsideCity, isReady, pickSuggestion, pickSaved } =
  useAddressEditor(address, () => props.city)

const markers = computed(() => (props.saved ? savedMarkers(savedAddresses.value) : []))

function pickMarker(id: string) {
  const saved = savedAddresses.value.find((address) => address.id === id)
  if (saved) pickSaved(saved)
}
</script>

<template>
  <div class="flex h-full flex-col">
    <BaseMap
      v-if="franchiseStore.addressMap"
      :center="mapCenter"
      :markers="markers"
      :zones="zones"
      :pin-note="pinNote"
      pin
      class="min-h-48 flex-1"
      @moved="locate"
      @marker-click="pickMarker"
    >
      <SavedAddressesButton
        v-if="saved"
        :city="city"
        class="absolute bottom-9 left-3 z-10"
        @select="pickSaved"
      />
    </BaseMap>

    <SheetPanel :floating="franchiseStore.addressMap">
      <SavedAddresses v-if="saved && !franchiseStore.addressMap" :city="city" @select="pickSaved" />

      <slot name="before" />

      <DeliveryAddressForm
        v-model="address"
        :suggest="franchiseStore.addressMap"
        :city="city"
        @select="pickSuggestion"
      />

      <p v-if="outsideCity" class="text-sm text-red-500">
        {{ t('fulfillment.outsideCity', { city }) }}
      </p>

      <slot :ready="isReady" :locating="isLocating" />
    </SheetPanel>
  </div>
</template>
