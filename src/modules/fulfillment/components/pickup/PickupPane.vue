<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
const showDetails = ref(false)
const backButton = ref<HTMLButtonElement | null>(null)
const listRef = ref<InstanceType<typeof PickupBranchList> | null>(null)
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
    if (!available.some((b) => b.id === selectedId.value)) {
      selectedId.value = available[0]?.id ?? null
      showDetails.value = false
    }
  },
  { immediate: true },
)

const markers = computed<MapMarker[]>(() =>
  branches.value.flatMap((branch) => {
    const lngLat = branchLngLat(branch)
    return lngLat
      ? [
          {
            id: branch.id,
            lngLat,
            active: showDetails.value && branch.id === selectedId.value,
            title: branch.name,
          },
        ]
      : []
  }),
)

const hasMap = computed(() => franchiseStore.addressMap && markers.value.length > 0)

const mapCenter = computed<LngLat>(
  () => branchLngLat(selected.value) ?? fallbackLngLat(branches.value),
)

onMounted(() => branchStore.initBranches().catch(() => null))

async function selectPreview(branch: Branch | undefined) {
  if (
    isSwitching.value ||
    !branch ||
    !branches.value.some((available) => available.id === branch.id)
  )
    return
  selectedId.value = branch.id
  showDetails.value = true
  await nextTick()
  backButton.value?.focus()
}

async function returnToList() {
  if (isSwitching.value) return
  showDetails.value = false
  await nextTick()
  if (selectedId.value) listRef.value?.focusBranch(selectedId.value)
}

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
      :zoom="showDetails ? 16 : 12"
      :markers="markers"
      class="min-h-48 flex-1"
      @marker-click="selectPreview(branches.find((branch) => branch.id === $event))"
    />

    <SheetPanel :floating="hasMap" :class="{ 'max-h-[55%]': hasMap }">
      <div
        v-if="showDetails && selected"
        class="flex flex-col gap-4"
        data-testid="pickup-branch-detail"
      >
        <button
          ref="backButton"
          type="button"
          :disabled="isSwitching"
          class="flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950"
          @click="returnToList"
        >
          <i class="pi pi-arrow-left" aria-hidden="true" />{{ t('common.back') }}
        </button>
        <ModeSwitch v-if="pickupOptions.length > 1" v-model="pickupKind" :options="pickupOptions" />
        <PickupBranchCard
          :branch="selected"
          :pickup-kind="pickupKind"
          :loading="isSwitching"
          @confirm="confirm(selected)"
        />
      </div>
      <PickupBranchList v-else ref="listRef" :branches="branches" @select="selectPreview" />
    </SheetPanel>
  </div>
</template>
