<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import BaseMap from '../map/BaseMap.vue'
import DeliveryAddressForm from './DeliveryAddressForm.vue'
import SavedAddresses from './SavedAddresses.vue'
import SheetPanel from '../SheetPanel.vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useFulfillmentStore } from '../../stores/fulfillment.store'
import { useFulfillmentFlowStore } from '../../stores/fulfillmentFlow.store'
import { useReverseGeocode } from '../../composables/useReverseGeocode'
import { branchLngLat, fallbackLngLat } from '../../utils/branchLocation'
import {
  emptyDeliveryAddress,
  fromClientAddress,
  isComplete,
  lngLatOf,
  sameCity,
  withGeo,
  type DeliveryAddress,
  type LngLat,
} from '../../utils/deliveryAddress'
import type { GeoAddress } from '../../api/geo.service'
import type { ClientAddress } from '@/modules/account/api/account.service'

const { t } = useI18n()
const branchStore = useBranchStore()
const franchiseStore = useFranchiseStore()
const fulfillmentStore = useFulfillmentStore()
const flowStore = useFulfillmentFlowStore()

const city = computed(() => branchStore.activeBranch?.branch_info?.city ?? null)

const address = ref<DeliveryAddress>(
  structuredClone(fulfillmentStore.deliveryAddress ?? emptyDeliveryAddress(city.value ?? '')),
)

const mapCenter = ref<LngLat>(
  lngLatOf(address.value) ??
    branchLngLat(branchStore.activeBranch) ??
    fallbackLngLat(branchStore.branches),
)

const { isLocating, locate, remember } = useReverseGeocode((geo, [longitude, latitude]) => {
  address.value = { ...withGeo(address.value, geo), longitude, latitude }
})

remember(lngLatOf(address.value))

const outsideCity = computed(() => !sameCity(address.value.city, city.value))
const canConfirm = computed(() => isComplete(address.value) && !outsideCity.value)

function focus(next: DeliveryAddress) {
  address.value = next
  mapCenter.value = lngLatOf(next) ?? mapCenter.value
  remember(lngLatOf(next))
}

function onSuggestion(geo: GeoAddress) {
  focus(withGeo(address.value, geo))
}

function onSaved(saved: ClientAddress) {
  focus(fromClientAddress(saved))
}

function confirm() {
  const branchId = branchStore.activeBranch?.id
  if (!branchId || !canConfirm.value) return

  fulfillmentStore.choose(branchId, { type: 'delivery', address: { ...address.value } })
  flowStore.complete()
}
</script>

<template>
  <div class="flex h-full flex-col">
    <BaseMap
      v-if="franchiseStore.addressMap"
      :center="mapCenter"
      pin
      class="min-h-48 flex-1"
      @moved="locate"
    />

    <SheetPanel :floating="franchiseStore.addressMap">
      <SavedAddresses :city="city" @select="onSaved" />

      <DeliveryAddressForm
        v-model="address"
        :suggest="franchiseStore.addressMap"
        :city="city"
        @select="onSuggestion"
      />

      <p v-if="outsideCity" class="text-sm text-red-500">
        {{ t('fulfillment.outsideCity', { city }) }}
      </p>

      <Button
        :label="t('fulfillment.deliverHere')"
        :disabled="!canConfirm"
        :loading="isLocating"
        class="h-12 w-full rounded-full! font-semibold"
        @click="confirm"
      />
    </SheetPanel>
  </div>
</template>
