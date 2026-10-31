<script setup lang="ts">
import { computed } from 'vue'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useSidebarStore } from '@/modules/widgets/sidebar/sidebar.store'
import SidebarTile from '@/modules/widgets/sidebar/SidebarTile.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const branchStore = useBranchStore()
const rating = computed(() => useFranchiseStore().rating)
const sidebarStore = useSidebarStore()

const deliveryTime = computed(() => branchStore.activeBranch?.branch_info?.delivery_time)

function openBranchModal() {
  sidebarStore.setSidebarVisible(false)
  branchStore.openModal()
}
</script>

<template>
  <SidebarTile
    icon="pi-map-marker"
    :title="branchStore.activeBranch?.name || t('branch.notSelected')"
    @click="openBranchModal"
  >
    <template #subtitle>
      <template v-if="deliveryTime">
        <span>~{{ t('branch.minutes', { minutes: deliveryTime }) }}</span>
        <span v-if="rating">·</span>
      </template>
      <template v-if="rating">
        <span>{{ rating.value.toFixed(1) }}</span>
        <i class="pi pi-star-fill text-amber-400 text-[10px] relative -top-[0.5px]" />
      </template>
    </template>

    <template #trailing>
      <span class="shrink-0 text-sm font-semibold text-primary">{{ t('branch.change') }}</span>
    </template>
  </SidebarTile>
</template>
