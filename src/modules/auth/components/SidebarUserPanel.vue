<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useSidebarStore } from '@/modules/widgets/sidebar/sidebar.store'
import { useBranchNavigation } from '@/modules/branch/composables/useBranchNavigation'
import { formatPhoneNumber } from '@/modules/widgets/contacts/utils/tel-format'
import SidebarTile from '@/modules/widgets/sidebar/SidebarTile.vue'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const sidebarStore = useSidebarStore()
const navigateTo = useBranchNavigation()
const { t } = useI18n()

const name = computed(() => authStore.client?.name?.trim() || t('auth.guestName'))
const phone = computed(() => formatPhoneNumber(authStore.client?.phone ?? ''))

function openOrders() {
  sidebarStore.setSidebarVisible(false)
  navigateTo('my-orders')
}

function signIn() {
  sidebarStore.setSidebarVisible(false)
  authStore.openModal()
}
</script>

<template>
  <SidebarTile
    v-if="authStore.isAuthenticated"
    icon="pi-user"
    :title="name"
    :subtitle="phone"
    @click="openOrders"
  >
    <template #trailing>
      <button
        type="button"
        class="size-9 shrink-0 rounded-full grid place-items-center text-gray-400 hover:text-red-500 hover:bg-white transition-colors cursor-pointer"
        :aria-label="t('auth.signOut')"
        :title="t('auth.signOut')"
        @click.stop="authStore.logout"
      >
        <i class="pi pi-sign-out" />
      </button>
    </template>
  </SidebarTile>

  <SidebarTile
    v-else-if="authStore.isEnabled"
    icon="pi-user"
    :title="t('auth.guestTitle')"
    :subtitle="t('auth.subtitle')"
    @click="signIn"
  >
    <template #trailing>
      <span class="shrink-0 text-sm font-semibold text-primary">{{ t('auth.signIn') }}</span>
    </template>
  </SidebarTile>
</template>
