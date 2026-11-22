<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useHead } from '@vueuse/head'
import { useThemeStore } from '@/modules/settings/stores/theme.store'
import { useLocaleStore } from '@/modules/settings/stores/locale.store'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useBrandColor } from '@/modules/franchise/composables/useBrandColor'
import AppToast from '@/modules/shared/components/ui/AppToast.vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useRoute } from 'vue-router'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useStorefrontUpdates } from '@/modules/branch/composables/useStorefrontUpdates'
import MaintenanceView from '@/modules/branch/views/MaintenanceView.vue'

useThemeStore()
useBrandColor()
const localeStore = useLocaleStore()
const franchiseStore = useFranchiseStore()
const authStore = useAuthStore()
const branchStore = useBranchStore()
const route = useRoute()
useStorefrontUpdates()
const maintenance = computed(() => {
  if (route.name === 'order-confirmation' || route.name === 'my-orders') return false
  if (franchiseStore.franchise?.maintenance_enabled) return true
  return route.name !== 'select-branch' && branchStore.activeBranch?.branch_info?.maintenance?.enabled === true
})
let selectionRefresh: ReturnType<typeof setInterval> | undefined
function refreshSelection() {
  if (route.name === 'select-branch' && document.visibilityState === 'visible') void franchiseStore.init()
}
function retryPushCleanup() {
  window.location.reload()
}
const { t } = useI18n()
const online = ref(true)
const reconnected = ref(false)
let reconnectTimer: ReturnType<typeof setTimeout> | undefined
function onOffline() {
  clearTimeout(reconnectTimer)
  online.value = false
  reconnected.value = false
}
function onOnline() {
  online.value = true
  reconnected.value = true
  clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(() => {
    reconnected.value = false
  }, 5000)
}
onMounted(() => {
  online.value = navigator.onLine
  window.addEventListener('offline', onOffline)
  window.addEventListener('online', onOnline)
  selectionRefresh = setInterval(refreshSelection, 20_000)
  document.addEventListener('visibilitychange', refreshSelection)
})
onUnmounted(() => {
  clearTimeout(reconnectTimer)
  window.removeEventListener('offline', onOffline)
  window.removeEventListener('online', onOnline)
  clearInterval(selectionRefresh)
  document.removeEventListener('visibilitychange', refreshSelection)
})

useHead({
  title: computed(() => franchiseStore.name),
  htmlAttrs: { lang: computed(() => localeStore.locale) },
})
</script>

<template>
  <AppToast />
  <div
    v-if="authStore.pushCleanupError"
    role="alert"
    class="fixed inset-x-0 top-0 z-[10000] bg-red-900 px-4 py-2 text-center text-sm text-white"
  >
    {{ t('pwa.push.cleanupFailed') }}
    <button type="button" class="ml-3 underline" @click="retryPushCleanup">
      {{ t('common.retry') }}
    </button>
  </div>
  <div
    v-if="!online || reconnected"
    role="status"
    class="fixed inset-x-0 top-0 z-[9999] bg-gray-900 px-4 py-2 text-center text-sm text-white"
  >
    {{ online ? t('errors.reconnected') : t('errors.offline') }}
  </div>
  <MaintenanceView v-if="maintenance" />
  <RouterView v-else />
</template>
