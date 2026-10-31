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
      root: {
        class:
          '!fixed !left-0 !top-0 !shrink-0 !m-0 !h-dvh !max-h-dvh !w-screen !max-w-none !rounded-none !border-0',
      },
      header: { class: '!px-5 !py-4 sm:!px-8' },
      content: { class: '!p-0 grow' },
    }"
  >
    <LoyaltyPanel />
  </Dialog>
</template>

<style>
html:has(#loyalty-modal) {
  scrollbar-gutter: auto;
}
</style>
