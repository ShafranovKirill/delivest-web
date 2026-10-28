<script setup lang="ts">
import { computed, ref } from 'vue'
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'
import { useAuthStore } from '../stores/auth.store'
import { useAccountLinks } from '../composables/useAccountLinks'
import { useBranchNavigation } from '@/modules/branch/composables/useBranchNavigation'
import { formatPhoneNumber } from '@/modules/widgets/contacts/utils/tel-format'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const links = useAccountLinks()
const navigateTo = useBranchNavigation()
const { t } = useI18n()
const menu = ref<InstanceType<typeof Menu> | null>(null)

const items = computed<MenuItem[]>(() => [
  {
    label: formatPhoneNumber(authStore.client?.phone ?? ''),
    items: [
      ...links.value.map((link) => ({
        label: link.label,
        icon: link.icon,
        command: () => navigateTo(link.route),
      })),
      { label: t('auth.signOut'), icon: 'pi pi-sign-out', command: authStore.logout },
    ],
  },
])

function open(event: Event) {
  if (authStore.isAuthenticated) menu.value?.toggle(event)
  else authStore.openModal()
}
</script>

<template>
  <template v-if="authStore.isEnabled">
    <slot :open="open" :signed-in="authStore.isAuthenticated" />
    <Menu ref="menu" :model="items" popup />
  </template>
</template>
