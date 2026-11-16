<script setup lang="ts">
import ResponsiveSheet from '@/modules/shared/components/ui/ResponsiveSheet.vue'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'
import { useI18n } from 'vue-i18n'

defineEmits<{ hide: [] }>()
defineProps<{ compact?: boolean }>()

const visible = defineModel<boolean>('visible', { required: true })
const { t } = useI18n()
const viewportStore = useViewportStore()
</script>

<template>
  <ResponsiveSheet
    v-model:visible="visible"
    block-scroll
    :aria-label="t('fulfillment.picker.title')"
    :dismissable-mask="!!compact && viewportStore.isMobile"
    :sheet-when="compact"
    sheet-class="flex! max-h-[90dvh]! border-0! shadow-2xl"
    :sheet-pt="{
      content: {
        class:
          'relative flex! flex-col! flex-1! min-h-0! overflow-hidden! p-0! [&_.p-inputtext]:rounded-3xl! [&_.p-textarea]:rounded-3xl!',
      },
    }"
    :show-header="false"
    :desktop-class="
      compact
        ? 'm-3! flex max-h-[calc(100dvh-1.5rem)]! w-[min(30rem,calc(100vw-1.5rem))]! max-w-none! flex-col overflow-hidden rounded-3xl! border-0! shadow-2xl'
        : 'm-0! h-dvh! max-h-dvh! w-screen max-w-none! rounded-none!'
    "
    :desktop-pt="{
      root: { class: compact ? 'rounded-3xl!' : 'rounded-none!' },
      content: {
        class:
          'relative flex flex-col p-0! flex-1 min-h-0 overflow-hidden [&_.p-inputtext]:rounded-3xl! [&_.p-textarea]:rounded-3xl!',
      },
    }"
    @hide="$emit('hide')"
  >
    <div :class="compact ? 'flex shrink-0 items-center gap-3 px-3 pt-3 pb-1 max-md:pt-9' : ''">
      <button
        v-if="!compact || !viewportStore.isMobile"
        type="button"
        :aria-label="t('common.close')"
        :class="
          compact
            ? 'order-2 ml-auto bg-gray-100! ring-0! shadow-none'
            : 'absolute left-3 top-3 z-10 shadow-lg'
        "
        class="grid size-10 shrink-0 place-items-center rounded-full bg-white text-gray-700 ring-1 ring-black/10 hover:bg-gray-50 dark:ring-white/10 cursor-pointer"
        @click="visible = false"
      >
        <i class="pi pi-times text-base" />
      </button>
      <div
        :class="compact ? 'min-w-0 flex-1' : 'absolute left-16 right-3 top-3 z-10 mx-auto max-w-xl'"
      >
        <slot name="header" />
      </div>
    </div>
    <div
      class="min-h-0 flex-1 overflow-hidden"
      :class="{
        '[&_.maplibregl-ctrl-top-right]:top-[50px]!': !compact,
        '[&_.maplibregl-ctrl-top-right>.maplibregl-ctrl-attrib]:mr-3!': !compact,
      }"
    >
      <slot />
    </div>
  </ResponsiveSheet>
</template>
