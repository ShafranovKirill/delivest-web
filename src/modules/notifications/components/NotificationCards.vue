<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { queryClient } from '@/api/client'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useBranchNavigation } from '@/modules/branch/composables/useBranchNavigation'
import { NotificationsService } from '../api/notifications.service'
import { NOTICES_KEY, useNotices } from '../composables/useNotifications'

const { t } = useI18n()
const navigate = useBranchNavigation()
const cart = useCartStore()
const notices = useNotices()
const busy = ref<string | null>(null)
const error = ref(false)
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined
watch(notices.enabled, (enabled) => {
  if (clock) clearInterval(clock)
  clock = enabled ? setInterval(() => { now.value = Date.now() }, 30_000) : undefined
}, { immediate: true })
watch([notices.identity, notices.epoch, notices.branchId, notices.enabled], () => {
  busy.value = null
  error.value = false
  activeId.value = null
  lastPosition.value = 0
  announcement.value = ''
  touchStart = null
})
onUnmounted(() => { if (clock) clearInterval(clock) })
const visible = computed(() => notices.data.value?.pages.flatMap((page) => page.data)
  .filter((item) => !item.expires_at || Date.parse(item.expires_at) > now.value) ?? [])
const activeId = ref<string | null>(null)
const lastPosition = ref(0)
const position = computed(() => Math.max(0, visible.value.findIndex((item) => item.id === activeId.value)))
const activeNotice = computed(() => visible.value[position.value])
const hasMany = computed(() => visible.value.length > 1)
const announcement = ref('')
let touchStart: { x: number; y: number } | null = null

watch(visible, (list) => {
  announcement.value = ''
  if (!list.length) {
    activeId.value = null
    lastPosition.value = 0
    return
  }
  const index = list.findIndex((item) => item.id === activeId.value)
  lastPosition.value = index >= 0 ? index : Math.min(lastPosition.value, list.length - 1)
  activeId.value = list[lastPosition.value]?.id ?? null
}, { immediate: true })

function show(direction: number) {
  if (!hasMany.value) return
  lastPosition.value = (position.value + direction + visible.value.length) % visible.value.length
  activeId.value = visible.value[lastPosition.value]?.id ?? null
  announcement.value = t('notifications.position', { current: lastPosition.value + 1, total: visible.value.length })
}

function onTouchStart(event: TouchEvent) {
  const touch = event.changedTouches[0]
  if (touch) touchStart = { x: touch.clientX, y: touch.clientY }
}

function onTouchEnd(event: TouchEvent) {
  if (!touchStart) return
  const touch = event.changedTouches[0]
  if (!touch) { touchStart = null; return }
  const deltaX = touch.clientX - touchStart.x
  const deltaY = touch.clientY - touchStart.y
  touchStart = null
  if (Math.abs(deltaX) >= 40 && Math.abs(deltaX) >= Math.abs(deltaY) * 1.5) show(deltaX < 0 ? 1 : -1)
}

async function dismiss(id: string) {
  if (busy.value) return
  const identity = notices.identity.value
  const epoch = notices.epoch.value
  const branchId = notices.branchId.value
  const current = () => notices.identity.value === identity && notices.epoch.value === epoch && notices.branchId.value === branchId
  busy.value = id
  error.value = false
  try {
    await NotificationsService.dismiss(branchId, notices.deviceId.value, id)
    if (current()) await queryClient.invalidateQueries({ queryKey: [NOTICES_KEY, identity, epoch, branchId] })
  } catch {
    if (current()) error.value = true
  } finally {
    if (current()) busy.value = null
  }
}

async function follow(id: string, cta: { type: 'apply_promo' | 'show_bonus'; value: string }) {
  if (busy.value) return
  const identity = notices.identity.value
  const epoch = notices.epoch.value
  const branchId = notices.branchId.value
  const current = () => notices.identity.value === identity && notices.epoch.value === epoch && notices.branchId.value === branchId
  busy.value = id
  error.value = false
  try {
    await NotificationsService.click(branchId, notices.deviceId.value, id)
    if (!current()) return
    if (cta.type === 'apply_promo') await cart.applyPromoCode(cta.value)
    else navigate('my-stars')
  } catch {
    if (current()) error.value = true
  } finally {
    if (current()) busy.value = null
  }
}
</script>

<template>
  <section v-if="notices.enabled.value && (visible.length || notices.hasNextPage.value)" class="mx-auto w-full max-w-7xl px-4 pb-4" :aria-label="t('notifications.offers')">
    <p v-if="error" role="alert" class="mb-2 text-sm text-red-700">{{ t('common.error') }}</p>
    <div v-if="activeNotice" class="max-w-xl touch-pan-y" @touchstart.passive="onTouchStart" @touchend="onTouchEnd" @touchcancel="touchStart = null">
      <article :key="activeNotice.id" class="relative rounded-3xl bg-white p-5 shadow-sm">
        <button type="button" class="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" :aria-label="t('common.close')" :disabled="busy === activeNotice.id" @click="dismiss(activeNotice.id)">
          <i class="pi pi-times" aria-hidden="true" />
        </button>
        <h2 class="pr-10 text-lg font-bold text-gray-950">{{ activeNotice.title }}</h2>
        <p class="mt-2 whitespace-pre-line text-sm text-gray-700">{{ activeNotice.body }}</p>
        <button v-if="activeNotice.cta" type="button" class="mt-4 rounded-xl bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50" :disabled="busy === activeNotice.id" @click="follow(activeNotice.id, activeNotice.cta)">
          {{ activeNotice.cta.type === 'apply_promo' ? t('notifications.apply') : t('notifications.showBonus') }}
        </button>
      </article>
      <div v-if="hasMany" class="mt-2 flex items-center justify-end gap-1">
        <button type="button" class="grid size-9 place-items-center rounded-full bg-white text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" :aria-label="t('notifications.previous')" @click="show(-1)">
          <i class="pi pi-chevron-left text-xs" aria-hidden="true" />
        </button>
        <span class="min-w-12 text-center text-sm tabular-nums text-gray-700" aria-hidden="true">{{ position + 1 }} / {{ visible.length }}</span>
        <button type="button" class="grid size-9 place-items-center rounded-full bg-white text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" :aria-label="t('notifications.next')" @click="show(1)">
          <i class="pi pi-chevron-right text-xs" aria-hidden="true" />
        </button>
      </div>
      <span class="sr-only" aria-live="polite">{{ announcement }}</span>
    </div>
    <button v-if="notices.hasNextPage.value" type="button" class="mt-3 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800" :disabled="notices.isFetchingNextPage.value" @click="notices.fetchNextPage()">
      {{ t('notifications.more') }}
    </button>
  </section>
</template>
