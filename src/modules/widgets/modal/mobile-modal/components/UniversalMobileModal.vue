<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { useMobileModalStore } from '../stores/modal.store'

const modalStore = useMobileModalStore()
</script>

<template>
  <Dialog
    v-model:visible="modalStore.isOpen"
    modal
    :blockScroll="false"
    :draggable="false"
    :showHeader="false"
    :pt="{
      mask: {
        class: '!top-[57px] !bottom-0 !items-start bg-black/40',
      },
      root: {
        class:
          '!w-screen !max-w-full !h-[calc(100dvh-57px)] !max-h-[calc(100dvh-57px)] !m-0 !rounded-none !border-none !shadow-none bg-gray-200',
      },
      content: {
        class: '!p-0 !flex !flex-col !h-full bg-gray-200 overflow-hidden',
      },
    }"
  >
    <div v-if="modalStore.currentComponent" class="w-full h-full flex flex-col">
      <div
        class="bg-white rounded-t-4xl w-full h-full flex flex-col pt-6 pb-4 px-4 shadow-sm overflow-hidden"
      >
        <component
          :is="modalStore.currentComponent"
          v-bind="modalStore.currentProps"
          @close="modalStore.closeModal"
        />
      </div>
    </div>
  </Dialog>
</template>
