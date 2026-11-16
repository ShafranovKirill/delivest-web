<script setup lang="ts">
import { computed } from 'vue'
import ResponsiveSheet from '@/modules/shared/components/ui/ResponsiveSheet.vue'
import CartComponent from '@/modules/cart/components/CartComponent.vue'
import { useMobileModalStore } from '../stores/modal.store'

const modalStore = useMobileModalStore()
const isCart = computed(() => modalStore.currentComponent === CartComponent)
const visible = computed({
  get: () => modalStore.isOpen,
  set: (open: boolean) => {
    if (!open) modalStore.closeModal()
  },
})
</script>

<template>
  <ResponsiveSheet
    v-model:visible="visible"
    :aria-label="modalStore.title"
    :sheet-class="isCart ? 'h-[min(85dvh,42rem)]!' : 'h-auto!'"
    :sheet-pt="{ content: { class: 'flex! min-h-0! flex-col! overflow-hidden! p-4!' } }"
  >
    <div
      v-if="modalStore.currentComponent"
      class="flex min-h-0 w-full flex-col bg-white"
      :class="isCart ? 'h-full' : 'max-h-[calc(100dvh-6rem)]'"
    >
      <component
        :is="modalStore.currentComponent"
        v-bind="modalStore.currentProps"
        @close="modalStore.closeModal"
      />
    </div>
  </ResponsiveSheet>
</template>
