<script setup lang="ts">
import Drawer from 'primevue/drawer'
import { useDesktopModalStore } from '../stores/modal.store'

const modalStore = useDesktopModalStore()
</script>

<template>
  <Drawer
    v-model:visible="modalStore.isOpen"
    position="right"
    :block-scroll="true"
    :modal="true"
    :dismissable="true"
    :header="modalStore.title"
    :pt="{
      mask: {
        class: 'bg-black/50 backdrop-blur-sm',
      },
      root: {
        class:
          '!w-[480px] !max-w-[calc(100vw-80px)] !h-full !m-0 !rounded-l-4xl !border-none !shadow-2xl bg-white relative overflow-hidden',
      },
      header: {
        class: '!flex !flex-row-reverse !items-center !justify-between !p-6 !pb-0',
      },
      title: {
        class: '!text-xl !font-bold !text-gray-800',
      },
      closeButton: {
        class: '!m-0 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full',
      },
      content: {
        class: '!p-6 !h-full overflow-y-auto flex flex-col',
      },
    }"
  >
    <div v-if="modalStore.currentComponent" class="w-full h-full flex flex-col">
      <div class="flex-1">
        <component
          :is="modalStore.currentComponent"
          v-bind="modalStore.currentProps"
          @close="modalStore.closeModal"
        />
      </div>
    </div>
  </Drawer>
</template>
