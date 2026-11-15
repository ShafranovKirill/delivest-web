<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { useI18n } from 'vue-i18n'
import { useLoyaltyModalStore } from '../stores/loyalty.store'
import LoyaltyPanel from './LoyaltyPanel.vue'
const modal = useLoyaltyModalStore()
const { t } = useI18n()
</script>
<template>
  <Dialog
    id="loyalty-modal"
    v-model:visible="modal.isOpen"
    modal
    :draggable="false"
    :block-scroll="true"
    :header="t('loyalty.title')"
    :dismissable-mask="false"
    :pt="{
      mask: { class: 'loyalty-mask' },
      root: {
        class:
          '!fixed !left-0 !top-15 !shrink-0 !m-0 !h-[calc(100dvh-3.75rem)] !max-h-[calc(100dvh-3.75rem)] !w-screen !max-w-none !overflow-hidden !rounded-t-4xl !rounded-b-none !border-0 !bg-white lg:!rounded-t-[2.5rem]',
      },
      header: { class: '!bg-white !px-4 !pb-0 !pt-8 sm:!px-6 sm:!pt-10' },
      content: { class: '!grow !bg-white !p-0' },
    }"
  >
    <LoyaltyPanel />
  </Dialog>
</template>

<style>
.p-dialog-mask.loyalty-mask {
  background: linear-gradient(
    to bottom,
    transparent 0 3.75rem,
    var(--color-gray-200) 3.75rem
  ) !important;
}

html:has(#loyalty-modal) {
  scrollbar-gutter: auto;
}
</style>
