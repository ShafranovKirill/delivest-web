<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'

const visible = defineModel<boolean>('visible', { required: true })
const viewportStore = useViewportStore()

const position = computed(() => (viewportStore.isMobile ? 'bottom' : 'center'))

const dialogClass = computed(() =>
  viewportStore.isMobile ? 'w-full! max-w-full! m-0!' : 'w-[min(92vw,420px)]',
)

const rootClass = computed(() =>
  viewportStore.isMobile
    ? 'rounded-t-4xl! rounded-b-none! overflow-hidden pb-[env(safe-area-inset-bottom)]'
    : 'rounded-4xl! overflow-hidden',
)
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    dismissable-mask
    :draggable="false"
    :position="position"
    :class="dialogClass"
    :pt="{ root: { class: rootClass } }"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
  </Dialog>
</template>
