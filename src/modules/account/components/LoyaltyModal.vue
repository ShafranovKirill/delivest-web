<script setup lang="ts">
import ResponsiveSheet from '@/modules/shared/components/ui/ResponsiveSheet.vue'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'
import { useI18n } from 'vue-i18n'
import { useLoyaltyModalStore } from '../stores/loyalty.store'
import LoyaltyPanel from './LoyaltyPanel.vue'
const modal = useLoyaltyModalStore()
const viewportStore = useViewportStore()
const { t } = useI18n()
</script>
<template>
  <ResponsiveSheet
    id="loyalty-modal"
    v-model:visible="modal.isOpen"
    :block-scroll="true"
    :header="t('loyalty.title')"
    :dismissable-mask="viewportStore.isMobile"
    sheet-class="h-[calc(100dvh-2rem)]!"
    :sheet-pt="{ content: { class: 'flex-1! p-0! bg-white' } }"
    :desktop-pt="{
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
  </ResponsiveSheet>
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
