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
})
onUnmounted(() => { if (clock) clearInterval(clock) })
const visible = computed(() => notices.data.value?.pages.flatMap((page) => page.data)
  .filter((item) => !item.expires_at || Date.parse(item.expires_at) > now.value) ?? [])

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
    <div class="grid gap-3 sm:grid-cols-2">
      <article v-for="notice in visible" :key="notice.id" class="relative rounded-3xl bg-white p-5 shadow-sm">
        <button type="button" class="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100" :aria-label="t('common.close')" :disabled="busy === notice.id" @click="dismiss(notice.id)">
          <i class="pi pi-times" aria-hidden="true" />
        </button>
        <h2 class="pr-10 text-lg font-bold text-gray-950">{{ notice.title }}</h2>
        <p class="mt-2 whitespace-pre-line text-sm text-gray-700">{{ notice.body }}</p>
        <button v-if="notice.cta" type="button" class="mt-4 rounded-xl bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50" :disabled="busy === notice.id" @click="follow(notice.id, notice.cta)">
          {{ notice.cta.type === 'apply_promo' ? t('notifications.apply') : t('notifications.showBonus') }}
        </button>
      </article>
    </div>
    <button v-if="notices.hasNextPage.value" type="button" class="mt-3 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800" :disabled="notices.isFetchingNextPage.value" @click="notices.fetchNextPage()">
      {{ t('notifications.more') }}
    </button>
  </section>
</template>
