<script setup lang="ts">
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import MapPlaceholder from './map/MapPlaceholder.vue'
import SheetPanel from './SheetPanel.vue'

const franchiseStore = useFranchiseStore()
</script>

<template>
  <div class="flex h-full flex-col" aria-busy="true">
    <MapPlaceholder v-if="franchiseStore.addressMap" class="min-h-48 flex-1" />

    <SheetPanel :floating="franchiseStore.addressMap">
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
