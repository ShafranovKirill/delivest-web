<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useIntervalFn, usePreferredReducedMotion } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '../stores/cart.store'
import { reasonsText } from '../utils/promoText'

const ROTATION_MS = 5000
const SWIPE_DISTANCE = 40

const cartStore = useCartStore()
const { t } = useI18n()
const reducedMotion = usePreferredReducedMotion()

const hints = computed(() => cartStore.hints)
const activeId = ref<string | null>(null)
const pointerInside = ref(false)
const focusInside = ref(false)
const paused = computed(() => pointerInside.value || focusInside.value)
const announcement = ref('')

const position = computed(() => {
  const index = hints.value.findIndex((hint) => hint.promotion_id === activeId.value)
  return index === -1 ? 0 : index
})
const hasMany = computed(() => hints.value.length > 1)

const { pause, resume } = useIntervalFn(
  () => {
    if (!paused.value) show(position.value + 1)
  },
  ROTATION_MS,
  { immediate: false },
)

let touchStart: { x: number; y: number } | null = null

function stopTimer() {
  pause()
}

function startTimer() {
  pause()

  if (paused.value || !hasMany.value || reducedMotion.value === 'reduce') return

  resume()
}

function show(index: number, announce = false) {
  const total = hints.value.length
  if (!total) return

  const next = (index + total) % total
  const hint = hints.value[next]
  if (!hint) return

  activeId.value = hint.promotion_id

  if (announce) {
    announcement.value = t('cart.promotionPosition', { current: next + 1, total })
  }
}

function move(direction: number) {
  show(position.value + direction, true)

  if (paused.value) {
    stopTimer()
  } else {
    startTimer()
  }
}

function onMouseEnter() {
  pointerInside.value = true
}

function onMouseLeave() {
  pointerInside.value = false
}

function onFocusIn() {
  focusInside.value = true
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (!next || !(event.currentTarget as HTMLElement).contains(next)) {
    focusInside.value = false
  }
}

function onTouchStart(event: TouchEvent) {
  const touch = event.changedTouches[0]
  if (!touch) return

  touchStart = { x: touch.clientX, y: touch.clientY }
}

function onTouchEnd(event: TouchEvent) {
  if (!touchStart) return

  const touch = event.changedTouches[0]
  if (!touch) return

  const deltaX = touch.clientX - touchStart.x
  const deltaY = touch.clientY - touchStart.y
  touchStart = null

  if (Math.abs(deltaX) < SWIPE_DISTANCE || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return

  move(deltaX < 0 ? 1 : -1)
}

watch(
  hints,
  (list) => {
    announcement.value = ''

    if (!list.length) {
      activeId.value = null
      stopTimer()
      return
    }

    if (!list.some((hint) => hint.promotion_id === activeId.value)) {
      const first = list[0]
      if (first) activeId.value = first.promotion_id
    }

    startTimer()
  },
  { immediate: true },
)

watch(paused, (value) => {
  if (value) {
    stopTimer()
  } else {
    startTimer()
  }
})

watch(reducedMotion, () => startTimer())
</script>

<template>
  <div
    v-if="hints.length"
    class="rounded-xl bg-amber-50 text-amber-800"
    role="group"
    :aria-label="t('cart.promotionHints')"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @touchstart.passive="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div class="grid">
      <div
        v-for="(hint, index) in hints"
        :key="hint.promotion_id"
        class="col-start-1 row-start-1 flex max-h-28 items-start gap-2 overflow-y-auto px-3 py-2 text-sm transition-opacity duration-300 motion-reduce:transition-none"
        :class="index === position ? 'opacity-100' : 'pointer-events-none opacity-0'"
        :aria-hidden="index === position ? undefined : 'true'"
      >
        <i class="pi pi-gift mt-0.5 text-xs" aria-hidden="true" />
        <span class="min-w-0 flex-1">
          <span class="block font-medium">{{ hint.name }}</span>
          <span class="mt-0.5 block text-xs">{{ reasonsText(hint.reasons) }}</span>
        </span>
      </div>
    </div>

    <div v-if="hasMany" class="flex items-center justify-end gap-1 px-2 pb-1.5">
      <button
        type="button"
        class="grid size-7 cursor-pointer place-items-center rounded-full text-amber-700 outline-none transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
        :aria-label="t('cart.previousPromotion')"
        @click="move(-1)"
      >
        <i class="pi pi-chevron-left text-xs" aria-hidden="true" />
      </button>
      <span class="px-1 text-xs tabular-nums text-amber-700" aria-hidden="true">
        {{ position + 1 }} / {{ hints.length }}
      </span>
      <button
        type="button"
        class="grid size-7 cursor-pointer place-items-center rounded-full text-amber-700 outline-none transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
        :aria-label="t('cart.nextPromotion')"
        @click="move(1)"
      >
        <i class="pi pi-chevron-right text-xs" aria-hidden="true" />
      </button>
    </div>

    <span class="sr-only" aria-live="polite">{{ announcement }}</span>
  </div>
</template>
