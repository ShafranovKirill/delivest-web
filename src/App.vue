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

useThemeStore()
useBrandColor()
const localeStore = useLocaleStore()
const franchiseStore = useFranchiseStore()
const authStore = useAuthStore()
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
})
onUnmounted(() => {
  clearTimeout(reconnectTimer)
  window.removeEventListener('offline', onOffline)
  window.removeEventListener('online', onOnline)
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
  <RouterView />
</template>
