<script setup lang="ts">
import { useLoyaltyQuery } from '@/modules/account/composables/useLoyaltyQuery'
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useSidebarStore } from '@/modules/widgets/sidebar/sidebar.store'
import { formatPhoneNumber } from '@/modules/widgets/contacts/utils/tel-format'
import { useAccountLinks } from '../composables/useAccountLinks'
import SidebarNav from '@/modules/widgets/sidebar/SidebarNav.vue'
import { useI18n } from 'vue-i18n'

const loyalty = useLoyaltyQuery()
const authStore = useAuthStore()
const sidebarStore = useSidebarStore()
const accountLinks = useAccountLinks()
const { t } = useI18n()

const name = computed(() => authStore.client?.name?.trim() || t('auth.guestName'))
const phone = computed(() => formatPhoneNumber(authStore.client?.phone ?? ''))

function openProfile() {
  sidebarStore.setSidebarVisible(false)
  authStore.openProfile()
}

function signIn() {
  sidebarStore.setSidebarVisible(false)
  authStore.openModal()
}
</script>

<template>
  <div v-if="authStore.isAuthenticated" class="flex flex-col gap-1">
    <button
      type="button"
      class="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-primary"
      @click="openProfile"
    >
      <i class="pi pi-user w-5 text-center text-gray-500" aria-hidden="true" />
      <span class="min-w-0 flex-1">
        <span class="block truncate text-[15px] font-semibold text-gray-900">{{ name }}</span>
        <span v-if="phone" class="block truncate text-xs text-gray-500">{{ phone }}</span>
      </span>
      <span
        v-if="loyalty.data.value?.enabled"
        class="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-bold text-amber-700"
      >
        <i class="pi pi-star-fill text-xs" aria-hidden="true" />{{ loyalty.data.value.balance }}
      </span>
    </button>
    <SidebarNav :aria-label="t('nav.account')" :items="accountLinks" class="pl-8" />
  </div>

  <button
    v-else-if="authStore.isEnabled"
    type="button"
    class="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-[15px] font-medium text-gray-800 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-primary"
    @click="signIn"
  >
    <i class="pi pi-user w-5 text-center text-gray-500" aria-hidden="true" />
    {{ t('auth.signInAccount') }}
  </button>
</template>
