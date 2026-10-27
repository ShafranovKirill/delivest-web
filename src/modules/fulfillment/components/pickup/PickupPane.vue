<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import BaseMap, { type MapMarker } from '../map/BaseMap.vue'
import PickupBranchList from './PickupBranchList.vue'
import PickupBranchCard from './PickupBranchCard.vue'
import type { Branch } from '@/modules/branch/api/branch.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useFulfillmentStore } from '../../stores/fulfillment.store'
import { useFulfillmentFlowStore } from '../../stores/fulfillmentFlow.store'
import { branchLngLat, fallbackLngLat } from '../../utils/branchLocation'
import type { LngLat } from '../../utils/deliveryAddress'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const branchStore = useBranchStore()
const franchiseStore = useFranchiseStore()
const fulfillmentStore = useFulfillmentStore()
const flowStore = useFulfillmentFlowStore()

const branches = computed(() => branchStore.branches.filter((branch) => branch.is_active))
const selectedId = ref<string | null>(branchStore.activeBranch?.id ?? null)
const selected = computed(() => branches.value.find((branch) => branch.id === selectedId.value))
const isSwitching = ref(false)

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
  if (branch.id === branchStore.activeBranch?.id) {
    fulfillmentStore.choose(branch.id, { type: 'pickup' })
    flowStore.complete()
    return
  }

  isSwitching.value = true
  try {
    await branchStore.selectBranch(branch)
    fulfillmentStore.choose(branch.id, { type: 'pickup' })
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

    <div
      class="mx-auto flex w-full max-w-2xl flex-col gap-3 overflow-y-auto p-4"
      :class="hasMap ? 'max-h-[55%]' : 'flex-1 pt-20'"
    >
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
    </div>
  </div>
</template>
