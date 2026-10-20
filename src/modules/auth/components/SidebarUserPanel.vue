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

const links = computed(() => [
  { route: 'my-orders', label: t('nav.myOrders') },
  { route: 'my-addresses', label: t('nav.myAddresses') },
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
  <div class="flex flex-col text-sm w-full">
    <div
      v-if="authStore.isAuthenticated"
      class="flex flex-col items-start pb-2 cursor-pointer group"
      @click="open('my-orders')"
    >
      <div class="flex items-center gap-1.5 min-w-0 max-w-full">
        <i
          class="pi pi-user text-xl! text-gray-700 group-hover:text-(--p-primary-500) transition-colors"
        ></i>
        <span
          class="text-xl font-bold text-gray-900 leading-tight truncate group-hover:text-(--p-primary-500) transition-colors"
        >
          {{ name || t('auth.guestName') }}
        </span>
      </div>
      <span class="pl-6.5 text-gray-500 font-semibold text-xs tabular-nums mt-1">
        {{ phone }}
      </span>
    </div>

    <div v-else class="flex flex-col items-start pb-2 cursor-pointer group" @click="signIn">
      <div class="flex items-center gap-1.5">
        <i
          class="pi pi-user text-xl! text-gray-700 group-hover:text-(--p-primary-500) transition-colors"
        ></i>
        <span
          class="text-xl font-bold text-gray-900 leading-tight group-hover:text-(--p-primary-500) transition-colors"
        >
          {{ t('auth.guestTitle') }}
        </span>
      </div>
      <span
        class="pl-6.5 text-(--p-primary-500) font-semibold text-xs group-hover:text-(--p-primary-800) transition-colors mt-1"
      >
        {{ t('auth.signIn') }}
      </span>
    </div>

    <div class="border-b border-gray-100 my-1"></div>

    <div v-if="authStore.isAuthenticated" class="flex items-center justify-between pt-1">
      <div class="flex items-center gap-2 font-medium text-gray-600">
        <template v-for="(link, index) in links" :key="link.route">
          <span v-if="index > 0">•</span>
          <button
            type="button"
            class="hover:text-(--p-primary-500) transition-colors cursor-pointer"
            @click="open(link.route)"
          >
            {{ link.label }}
          </button>
        </template>
      </div>

      <button
        type="button"
        class="text-gray-400 hover:text-red-500 focus:outline-none p-1 transition-colors cursor-pointer"
        :aria-label="t('auth.signOut')"
        :title="t('auth.signOut')"
        @click="authStore.logout"
      >
        <i class="pi pi-sign-out text-base"></i>
      </button>
    </div>

    <p v-else class="pt-1 font-medium text-gray-600">{{ t('auth.subtitle') }}</p>
  </div>
</template>
