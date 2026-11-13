<script setup lang="ts">
import { computed } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import MapPlaceholder from './map/MapPlaceholder.vue'
import SheetPanel from './SheetPanel.vue'

const franchiseStore = useFranchiseStore()
const branchStore = useBranchStore()
const props = withDefaults(defineProps<{ map?: boolean | null }>(), { map: null })
const hasMap = computed(() => props.map ?? (franchiseStore.addressMap && branchStore.mapAddress))
</script>

<template>
  <div class="flex h-full flex-col" aria-busy="true">
    <MapPlaceholder v-if="hasMap" class="min-h-48 flex-1" />

    <SheetPanel :floating="hasMap">
      <div class="flex flex-col gap-2">
        <Skeleton height="2.75rem" />
        <div v-for="row in 2" :key="row" class="grid grid-cols-2 gap-2">
          <Skeleton height="2.75rem" />
          <Skeleton height="2.75rem" />
        </div>
        <Skeleton height="2.75rem" />
      </div>
      <Skeleton height="3rem" border-radius="9999px" />
    </SheetPanel>
  </div>
</template>
