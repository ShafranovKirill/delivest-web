<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { useI18n } from 'vue-i18n'

defineEmits<{ hide: [] }>()
defineProps<{ compact?: boolean }>()

const visible = defineModel<boolean>('visible', { required: true })
const { t } = useI18n()
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    block-scroll
    :show-header="false"
    :class="compact
      ? 'm-3! flex max-h-[calc(100dvh-1.5rem)]! w-[min(30rem,calc(100vw-1.5rem))]! max-w-none! flex-col overflow-hidden rounded-3xl! border-0! shadow-2xl'
      : 'm-0! h-dvh! max-h-dvh! w-screen max-w-none! rounded-none!'"
    content-class="relative flex flex-col p-0! flex-1 min-h-0 overflow-hidden [&_.p-inputtext]:rounded-3xl! [&_.p-textarea]:rounded-3xl!"
    @hide="$emit('hide')"
  >
    <div :class="compact ? 'flex shrink-0 items-center gap-3 px-5 pt-5 pb-1' : ''">
      <button
        type="button"
        :aria-label="t('common.close')"
        :class="compact ? 'order-2 ml-auto size-9! shrink-0 bg-gray-100! ring-0! shadow-none' : 'absolute left-3 top-3 z-10 shadow-lg'"
        class="grid size-11 place-items-center rounded-full bg-white text-gray-700 ring-1 ring-black/10 hover:bg-gray-50 dark:ring-white/10 cursor-pointer"
        @click="visible = false"
      >
        <i class="pi pi-times text-lg" />
      </button>
      <div :class="compact ? 'min-w-0 flex-1' : 'absolute left-16 right-3 top-3 z-10 mx-auto max-w-xl'">
        <slot name="header" />
      </div>
    </div>
    <div class="min-h-0 flex-1 overflow-hidden">
      <slot />
    </div>
  </Dialog>
</template>
