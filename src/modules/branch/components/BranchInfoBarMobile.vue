<script setup lang="ts">
import { computed } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useSidebarStore } from '@/modules/widgets/sidebar/sidebar.store'
import SidebarTile from '@/modules/widgets/sidebar/SidebarTile.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const branchStore = useBranchStore()
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
        <span>·</span>
      </template>
      <span>4.78</span>
      <i class="pi pi-star-fill text-amber-400 text-[10px] relative -top-[0.5px]" />
    </template>

    <template #trailing>
      <span class="shrink-0 text-sm font-semibold text-primary">{{ t('branch.change') }}</span>
    </template>
  </SidebarTile>
</template>
