<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { useI18n } from 'vue-i18n'

defineEmits<{ hide: [] }>()

const visible = defineModel<boolean>('visible', { required: true })
const { t } = useI18n()
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :show-header="false"
    class="m-0! h-dvh! max-h-dvh! w-screen max-w-none! rounded-none!"
    content-class="relative flex flex-col p-0! flex-1 min-h-0"
    @hide="$emit('hide')"
  >
    <button
      type="button"
      :aria-label="t('common.close')"
      class="absolute left-3 top-3 z-10 grid size-11 place-items-center rounded-full bg-white text-gray-700 shadow-lg ring-1 ring-black/10 hover:bg-gray-50 dark:ring-white/10 cursor-pointer"
      @click="visible = false"
    >
      <i class="pi pi-times text-lg" />
    </button>
    <div class="absolute left-16 right-3 top-3 z-10 mx-auto max-w-xl">
      <slot name="header" />
    </div>
    <div class="min-h-0 flex-1">
      <slot />
    </div>
  </Dialog>
</template>
