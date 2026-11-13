<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { fulfillmentMethods, hasOnsite } from '../../utils/fulfillmentMethods'
import ModeSwitch from '../ModeSwitch.vue'
import BaseMap, { type MapMarker } from '../map/BaseMap.vue'
import PickupBranchList from './PickupBranchList.vue'
import PickupBranchCard from './PickupBranchCard.vue'
import SheetPanel from '../SheetPanel.vue'
import type { Branch } from '@/modules/branch/api/branch.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useFulfillmentStore } from '../../stores/fulfillment.store'
import { useFulfillmentFlowStore } from '../../stores/fulfillmentFlow.store'
import { branchLngLat, fallbackLngLat } from '../../utils/branchLocation'
import type { LngLat } from '../../utils/deliveryAddress'
import { useFunnelAnalytics } from '@/modules/analytics/useFunnelAnalytics'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const branchStore = useBranchStore()
const franchiseStore = useFranchiseStore()
const fulfillmentStore = useFulfillmentStore()
const flowStore = useFulfillmentFlowStore()
const analytics = useFunnelAnalytics()

const branches = computed(() =>
  branchStore.branches.filter((branch) => branch.is_active && hasOnsite(branch)),
)
const selectedId = ref<string | null>(branchStore.activeBranch?.id ?? null)
const selected = computed(() => branches.value.find((branch) => branch.id === selectedId.value))
const isSwitching = ref(false)
type PickupKind = 'pickup' | 'dine_in'
const pickupKind = ref<PickupKind>(
  fulfillmentStore.current?.type === 'pickup' && fulfillmentStore.current.pickupKind
    ? fulfillmentStore.current.pickupKind
    : 'pickup',
)
const pickupOptions = computed<Array<{ value: PickupKind; label: string }>>(() => {
  const methods = fulfillmentMethods(selected.value)
  return [
    ...(methods.includes('pickup')
      ? [{ value: 'pickup' as const, label: t('order.form.takeaway') }]
      : []),
    ...(methods.includes('dine_in')
      ? [{ value: 'dine_in' as const, label: t('order.form.dineIn') }]
      : []),
  ]
})
watch(
  pickupOptions,
  (options) => {
    if (!options.some((option) => option.value === pickupKind.value))
      pickupKind.value = options[0]?.value ?? 'pickup'
  },
  { immediate: true },
)
watch(
  branches,
  (available) => {
    if (!available.some((b) => b.id === selectedId.value))
      selectedId.value = available[0]?.id ?? null
  },
  { immediate: true },
)

const markers = computed<MapMarker[]>(() =>
  branches.value.flatMap((branch) => {
    const lngLat = branchLngLat(branch)
    return lngLat ? [{ id: branch.id, lngLat, active: branch.id === selectedId.value }] : []
  }),
)

const hasMap = computed(() => franchiseStore.addressMap && markers.value.length > 0)

const mapCenter = computed<LngLat>(
  () => branchLngLat(selected.value) ?? fallbackLngLat(branches.value),
)

onMounted(() => branchStore.initBranches().catch(() => null))

async function confirm(branch: Branch) {
  if (!hasOnsite(branch)) return
  if (branch.id === branchStore.activeBranch?.id) {
    fulfillmentStore.choose(branch.id, { type: 'pickup', pickupKind: pickupKind.value })
    analytics.track('fulfillment_selected')
    flowStore.complete()
    return
  }

  isSwitching.value = true
  try {
    await branchStore.selectBranch(branch)
    fulfillmentStore.choose(branch.id, { type: 'pickup', pickupKind: pickupKind.value })
    analytics.track('fulfillment_selected')
    flowStore.abandon()
    await router.push(`/${branch.slug}`)
  } catch {
    toast.add({ severity: 'error', summary: t('branch.select.selectFailed'), life: 3000 })
  } finally {
    isSwitching.value = false
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <BaseMap
      v-if="hasMap"
      :center="mapCenter"
      :zoom="12"
      :markers="markers"
      class="min-h-48 flex-1"
      @marker-click="selectedId = $event"
    />

    <SheetPanel :floating="hasMap" :class="{ 'max-h-[55%]': hasMap }">
      <ModeSwitch
        v-if="pickupOptions.length > 1"
        v-model="pickupKind"
        :options="pickupOptions"
        class="mb-3"
      />
      <PickupBranchCard
        v-if="selected"
        :branch="selected"
        :loading="isSwitching"
        @confirm="confirm(selected)"
      />
      <PickupBranchList
        :branches="branches"
        :selected-id="selectedId"
        @select="selectedId = $event.id"
      />
    </SheetPanel>
  </div>
</template>
