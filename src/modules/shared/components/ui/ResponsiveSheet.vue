<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import { useI18n } from 'vue-i18n'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'

const props = withDefaults(
  defineProps<{
    desktopClass?: string
    desktopPt?: Record<string, { class?: string }>
    sheetClass?: string
    sheetPt?: Record<string, { class?: string }>
    sheetWhen?: boolean
    dismissableMask?: boolean
  }>(),
  {
    desktopClass: 'w-[min(92vw,420px)]',
    sheetWhen: true,
    dismissableMask: true,
  },
)
const visible = defineModel<boolean>('visible', { required: true })
const viewportStore = useViewportStore()
const { t } = useI18n()
const mobile = computed(() => viewportStore.isMobile && props.sheetWhen)
const dialogClass = computed(() =>
  mobile.value
    ? `responsive-sheet m-0! w-full! max-w-full! max-h-[calc(100dvh-2rem)]! rounded-t-4xl! rounded-b-none! overflow-hidden ${props.sheetClass ?? ''}`
    : props.desktopClass,
)
const dialogPt = computed(() => {
  if (!mobile.value)
    return {
      ...props.desktopPt,
      root: {
        ...props.desktopPt?.root,
        class: props.desktopPt?.root?.class ?? 'rounded-4xl! overflow-hidden',
      },
    }
  return {
    ...props.sheetPt,
    root: {
      ...props.sheetPt?.root,
      class: `relative flex flex-col overflow-hidden rounded-t-4xl! rounded-b-none! bg-white ${props.sheetPt?.content?.class ? 'pb-[env(safe-area-inset-bottom)]!' : ''} ${props.sheetPt?.root?.class ?? ''}`,
    },
    header: {
      ...props.sheetPt?.header,
      class: `shrink-0 pt-9! ${props.sheetPt?.header?.class ?? ''}`,
    },
    content: {
      ...props.sheetPt?.content,
      class:
        props.sheetPt?.content?.class ??
        'min-h-0 overflow-y-auto! overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]!',
    },
    footer: {
      ...props.sheetPt?.footer,
      class: `shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]! ${props.sheetPt?.footer?.class ?? ''}`,
    },
  }
})

let pointerId: number | null = null
let startY = 0
let startX = 0
let distance = 0
let maxMovement = 0
let resetTimer: ReturnType<typeof setTimeout> | null = null
let root: HTMLElement | null = null
let suppressClick = false

function onPointerDown(event: PointerEvent) {
  suppressClick = false
  if (!event.isPrimary || !mobile.value || (event.pointerType === 'mouse' && event.button !== 0))
    return
  pointerId = event.pointerId
  startY = event.clientY
  startX = event.clientX
  distance = 0
  maxMovement = 0
  if (resetTimer !== null) clearTimeout(resetTimer)
  resetTimer = null
  root = (event.currentTarget as HTMLElement).closest('.p-dialog')
  if (root) root.style.transition = 'none'
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function onPointerMove(event: PointerEvent) {
  if (pointerId !== event.pointerId) return
  const deltaY = event.clientY - startY
  maxMovement = Math.max(maxMovement, Math.abs(deltaY), Math.abs(event.clientX - startX))
  distance = deltaY > Math.abs(event.clientX - startX) ? Math.max(0, deltaY) : 0
  if (root) root.style.transform = `translateY(${distance}px)`
}
function finishPointer(event: PointerEvent, cancelled = false) {
  if (pointerId !== event.pointerId) return
  const handle = event.currentTarget as HTMLElement
  if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId)
  const deltaY = event.clientY - startY
  maxMovement = Math.max(maxMovement, Math.abs(deltaY), Math.abs(event.clientX - startX))
  suppressClick = cancelled || maxMovement > 6
  const shouldClose = !cancelled && distance > 96 && deltaY > Math.abs(event.clientX - startX)
  if (root) {
    const sheet = root
    const animateBack =
      !shouldClose && distance > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    sheet.style.transition = animateBack ? 'transform 180ms ease-out' : ''
    sheet.style.transform = ''
    if (animateBack)
      resetTimer = setTimeout(() => {
        sheet.style.transition = ''
        resetTimer = null
      }, 190)
  }
  if (shouldClose) visible.value = false
  root = null
  pointerId = null
  distance = 0
  maxMovement = 0
}
function onHandleClick(event: MouseEvent) {
  if (!suppressClick || event.detail === 0) visible.value = false
  suppressClick = false
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :dismissable-mask="dismissableMask"
    :closable="!mobile"
    :draggable="false"
    :position="mobile ? 'bottom' : 'center'"
    :class="dialogClass"
    :pt="dialogPt"
  >
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <button
      v-if="mobile"
      type="button"
      :aria-label="t('common.close')"
      class="absolute top-0 left-1/2 z-20 h-8 w-24 -translate-x-1/2 cursor-grab touch-none rounded-full before:absolute before:top-3.5 before:left-1/2 before:h-1 before:w-10 before:-translate-x-1/2 before:rounded-full before:bg-gray-400"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="finishPointer"
      @pointercancel="finishPointer($event, true)"
      @click="onHandleClick"
    />
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </Dialog>
</template>

<style>
@media (max-width: 767px) {
  .p-dialog.responsive-sheet.p-dialog-enter-from,
  .p-dialog.responsive-sheet.p-dialog-leave-to {
    transform: translateY(100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .p-dialog.responsive-sheet {
    transition-duration: 0.01ms !important;
  }
}
</style>
