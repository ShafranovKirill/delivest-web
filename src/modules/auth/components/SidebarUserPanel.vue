<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useSidebarStore } from '@/modules/widgets/sidebar/sidebar.store'
import { useBranchNavigation } from '@/modules/branch/composables/useBranchNavigation'
import { formatPhoneNumber } from '@/modules/widgets/contacts/utils/tel-format'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const sidebarStore = useSidebarStore()
const navigateTo = useBranchNavigation()
const { t } = useI18n()

const name = computed(() => authStore.client?.name?.trim() || '')
const phone = computed(() => formatPhoneNumber(authStore.client?.phone ?? ''))

const initials = computed(() => {
  const parts = name.value.split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  return parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
})

const links = computed(() => [
  { route: 'my-orders', label: t('nav.myOrders'), icon: 'pi-receipt' },
  { route: 'my-addresses', label: t('nav.myAddresses'), icon: 'pi-map-marker' },
])

function open(routeName: string) {
  sidebarStore.isSidebarVisible = false
  navigateTo(routeName)
}

function signIn() {
  sidebarStore.isSidebarVisible = false
  authStore.openModal()
}
</script>

<template>
  <div v-if="authStore.isAuthenticated" class="rounded-3xl bg-gray-100 p-4 flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <div
        class="size-12 shrink-0 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold"
      >
        <span v-if="initials">{{ initials }}</span>
        <i v-else class="pi pi-user text-xl" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="font-bold text-gray-900 truncate">{{ name || t('auth.guestName') }}</p>
        <p class="text-sm text-gray-500 tabular-nums">{{ phone }}</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="link in links"
        :key="link.route"
        type="button"
        class="flex flex-col items-start gap-1 rounded-2xl bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 hover:text-primary transition-colors cursor-pointer"
        @click="open(link.route)"
      >
        <i class="pi text-primary" :class="link.icon" />
        {{ link.label }}
      </button>
    </div>

    <button
      type="button"
      class="flex items-center justify-center gap-2 rounded-2xl py-2 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
      @click="authStore.logout"
    >
      <i class="pi pi-sign-out text-xs" />
      {{ t('auth.signOut') }}
    </button>
  </div>

  <div v-else class="rounded-3xl bg-gray-100 p-4 flex items-center gap-3">
    <div
      class="size-12 shrink-0 rounded-full bg-white text-gray-400 flex items-center justify-center"
    >
      <i class="pi pi-user text-xl" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="font-bold text-gray-900">{{ t('auth.guestTitle') }}</p>
      <p class="text-xs text-gray-500">{{ t('auth.subtitle') }}</p>
    </div>
    <button
      type="button"
      class="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
      @click="signIn"
    >
      {{ t('auth.signIn') }}
    </button>
  </div>
</template>
