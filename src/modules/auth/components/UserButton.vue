<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'
import { useAuthStore } from '../stores/auth.store'
import { useBranchNavigation } from '@/modules/branch/composables/useBranchNavigation'
import { formatPhoneNumber } from '@/modules/widgets/contacts/utils/tel-format'

const authStore = useAuthStore()
const navigateTo = useBranchNavigation()
const menu = ref<InstanceType<typeof Menu> | null>(null)

const items = computed<MenuItem[]>(() => [
  {
    label: formatPhoneNumber(authStore.client?.phone ?? ''),
    items: [
      { label: 'Мои заказы', icon: 'pi pi-receipt', command: () => navigateTo('my-orders') },
      { label: 'Мои адреса', icon: 'pi pi-map-marker', command: () => navigateTo('my-addresses') },
      { label: 'Выйти', icon: 'pi pi-sign-out', command: authStore.logout },
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
    :aria-label="authStore.isAuthenticated ? 'Профиль' : 'Войти'"
    @click="onClick"
  />
  <Menu ref="menu" :model="items" popup />
</template>
