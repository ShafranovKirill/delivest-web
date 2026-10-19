<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useStockStore } from '../stores/stock.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { PRODUCT_QUERY_KEY } from '@/modules/menu/composables/useProductRoute'

const router = useRouter()
const stockStore = useStockStore()
const branchStore = useBranchStore()
const { isStockModalOpen, activeStock } = storeToRefs(stockStore)

function openProduct() {
  const productSlug = activeStock.value?.product_slug
  const branchSlug = branchStore.activeBranch?.slug
  if (!productSlug || !branchSlug) return

  stockStore.closeProductModal()
  router.push({
    name: 'menu',
    params: { slug: branchSlug },
    query: { [PRODUCT_QUERY_KEY]: productSlug },
  })
}
</script>

<template>
  <Dialog
    v-model:visible="isStockModalOpen"
    modal
    dismissable-mask
    :draggable="false"
    class="w-[min(92vw,440px)]"
    :pt="{ root: { class: 'rounded-4xl! overflow-hidden' } }"
    @hide="stockStore.closeProductModal"
  >
    <template #header>
      <span class="text-xl font-extrabold text-gray-950">Акция</span>
    </template>

    <div v-if="activeStock" class="flex flex-col gap-4">
      <div class="w-full aspect-4/3 rounded-3xl overflow-hidden bg-gray-100">
        <img
          :src="activeStock.photo_url"
          :alt="activeStock.text || 'Акция'"
          class="size-full object-cover"
        />
      </div>

      <p v-if="activeStock.text" class="text-base leading-relaxed text-gray-700">
        {{ activeStock.text }}
      </p>
    </div>

    <template #footer>
      <div class="flex w-full flex-col gap-2 pt-2">
        <Button
          v-if="activeStock?.product_slug"
          label="Перейти к товару"
          icon="pi pi-arrow-right"
          iconPos="right"
          class="h-12 w-full rounded-full! font-semibold"
          @click="openProduct"
        />
        <Button
          label="Закрыть"
          severity="secondary"
          class="h-12 w-full rounded-full! font-semibold"
          @click="stockStore.closeProductModal"
        />
      </div>
    </template>
  </Dialog>
</template>
