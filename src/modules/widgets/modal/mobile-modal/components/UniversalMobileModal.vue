<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import ResponsiveSheet from '@/modules/shared/components/ui/ResponsiveSheet.vue'
import { useMobileModalStore } from '../stores/modal.store'

const modalStore = useMobileModalStore()
const isCart = computed(() => modalStore.kind === 'cart')
const visible = computed({
  get: () => modalStore.isOpen,
  set: (open: boolean) => {
    if (!open) modalStore.closeModal()
  },
})
</script>

<template>
  <Dialog
    v-if="isCart"
    v-model:visible="visible"
    modal
    block-scroll
    :draggable="false"
    :show-header="false"
    :aria-label="modalStore.title"
    :pt="{
      mask: { class: 'top-15! bottom-0! items-start!' },
      root: {
        class:
          'w-screen! max-w-full! h-[calc(100dvh-60px)]! max-h-[calc(100dvh-60px)]! m-0! rounded-none! border-none! shadow-none! bg-gray-200',
      },
      content: { class: 'p-0! flex! flex-col! h-full! bg-gray-200 overflow-hidden' },
    }"
  >
    <div v-if="modalStore.currentComponent" class="flex h-full w-full flex-col">
      <div class="flex h-full w-full flex-col overflow-hidden rounded-t-4xl bg-white px-4 pt-6 pb-4 shadow-sm">
        <component
          :is="modalStore.currentComponent"
          v-bind="modalStore.currentProps"
          @close="modalStore.closeModal"
        />
      </div>
    </div>
  </Dialog>
  <ResponsiveSheet
    v-else
    v-model:visible="visible"
    :aria-label="modalStore.title"
    sheet-class="h-auto!"
    :sheet-pt="{ content: { class: 'flex! min-h-0! flex-col! overflow-hidden! p-4!' } }"
  >
    <div
      v-if="modalStore.currentComponent"
      class="flex min-h-0 max-h-[calc(100dvh-6rem)] w-full flex-col bg-white"
    >
      <component
        :is="modalStore.currentComponent"
        v-bind="modalStore.currentProps"
        @close="modalStore.closeModal"
      />
    </div>
  </ResponsiveSheet>
</template>
