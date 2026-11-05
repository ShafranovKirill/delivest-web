<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import { useAuthStore } from '../stores/auth.store'
import { useAccountLinks } from '../composables/useAccountLinks'
import { useBranchNavigation } from '@/modules/branch/composables/useBranchNavigation'
import { formatPhoneNumber } from '@/modules/widgets/contacts/utils/tel-format'
import { useI18n } from 'vue-i18n'
import { useLoyaltyQuery } from '@/modules/account/composables/useLoyaltyQuery'
import { useStarsLabel } from '@/modules/account/composables/useStarsLabel'

const authStore = useAuthStore()
const links = useAccountLinks()
const navigateTo = useBranchNavigation()
const { t } = useI18n()
const loyalty = useLoyaltyQuery()
const starsLabel = useStarsLabel()

const name = computed(() => authStore.client?.name?.trim() || t('auth.profile'))
const phone = computed(() => formatPhoneNumber(authStore.client?.phone ?? ''))

function open() {
  if (authStore.isAuthenticated) authStore.openProfile()
  else authStore.openModal()
}

function followLink(route: string) {
  authStore.closeProfile()
  navigateTo(route)
}
</script>

<template>
  <template v-if="authStore.isEnabled">
    <slot :open="open" :signed-in="authStore.isAuthenticated" />
    <Dialog
      v-model:visible="authStore.isProfileOpen"
      modal
      dismissable-mask
      :draggable="false"
      :header="t('auth.profile')"
      class="w-[min(92vw,440px)]"
      :pt="{ root: { class: 'rounded-4xl! overflow-hidden' } }"
    >
      <div class="flex flex-col gap-5 pb-1">
        <div class="flex items-center gap-4 rounded-3xl bg-gray-100 p-4">
          <span class="grid size-13 shrink-0 place-items-center rounded-2xl bg-white text-primary">
            <i class="pi pi-user text-xl" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <p class="truncate text-lg font-bold text-gray-950">{{ name }}</p>
            <p class="text-sm text-gray-600">{{ phone }}</p>
          </div>
        </div>

        <div
          v-if="loyalty.data.value?.enabled"
          class="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-amber-800"
        >
          <i class="pi pi-star-fill" aria-hidden="true" />
          <span class="font-semibold">{{
            t('loyalty.balance', { stars: starsLabel(loyalty.data.value.balance) })
          }}</span>
        </div>

        <nav :aria-label="t('nav.account')" class="flex flex-col gap-1">
          <button
            v-for="link in links"
            :key="link.route"
            type="button"
            class="flex min-h-13 w-full items-center gap-3 rounded-2xl px-4 text-left font-semibold text-gray-800 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
            @click="followLink(link.route)"
          >
            <i :class="link.icon" class="w-5 text-primary" aria-hidden="true" />
            <span class="flex-1">{{ link.label }}</span>
            <i class="pi pi-angle-right text-sm text-gray-400" aria-hidden="true" />
          </button>
        </nav>

        <button
          type="button"
          class="flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left font-semibold text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
          @click="authStore.logout"
        >
          <i class="pi pi-sign-out w-5" aria-hidden="true" />
          {{ t('auth.signOut') }}
        </button>
      </div>
    </Dialog>
  </template>
</template>
