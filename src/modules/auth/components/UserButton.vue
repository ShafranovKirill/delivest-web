<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'
import { useAuthStore } from '../stores/auth.store'
import { useBranchNavigation } from '@/modules/branch/composables/useBranchNavigation'
import { formatPhoneNumber } from '@/modules/widgets/contacts/utils/tel-format'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t } = useI18n()
const navigateTo = useBranchNavigation()
const menu = ref<InstanceType<typeof Menu> | null>(null)

const items = computed<MenuItem[]>(() => [
  {
    label: formatPhoneNumber(authStore.client?.phone ?? ''),
    items: [
      { label: t('nav.myOrders'), icon: 'pi pi-receipt', command: () => navigateTo('my-orders') },
      {
        label: t('nav.myAddresses'),
        icon: 'pi pi-map-marker',
        command: () => navigateTo('my-addresses'),
      },
      { label: t('auth.signOut'), icon: 'pi pi-sign-out', command: authStore.logout },
    ],
  },
])

function onClick(event: Event) {
  if (authStore.isAuthenticated) menu.value?.toggle(event)
  else authStore.openModal()
}
</script>

<template>
  <Button
    icon="pi pi-user text-xl!"
    variant="text"
    :class="{ 'text-primary!': authStore.isAuthenticated }"
    :aria-label="authStore.isAuthenticated ? t('auth.profile') : t('auth.signIn')"
    @click="onClick"
  />
  <Menu ref="menu" :model="items" popup />
</template>
