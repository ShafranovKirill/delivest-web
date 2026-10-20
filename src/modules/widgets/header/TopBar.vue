<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useContactsStore } from '../contacts/stores/constacts.store'
import { useLocaleStore } from '@/modules/settings/stores/locale.store'
import { LOCALE_NAMES } from '@/i18n'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const branchStore = useBranchStore()
const contactStore = useContactsStore()
const localeStore = useLocaleStore()
const { t } = useI18n()

const navigateTo = (routeName: string) => {
  if (branchStore.activeBranch?.slug) {
    router.push({
      name: routeName,
      params: { slug: branchStore.activeBranch.slug },
    })
  }
}

const openContacts = () => {
  contactStore.openModal()
}
</script>

<template>
  <div class="w-full bg-gray-200 border-b border-gray-300">
    <div
      class="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center text-sm text-gray-600"
    >
      <div class="flex gap-4">
        <button
          type="button"
          @click="navigateTo('menu')"
          class="hover:underline hover:text-gray-900 transition-colors cursor-pointer"
        >
          {{ t('nav.menu') }}
        </button>

        <button
          type="button"
          @click="navigateTo('promotions')"
          class="hover:underline hover:text-gray-900 transition-colors cursor-pointer"
        >
          {{ t('nav.promotions') }}
        </button>

        <button
          type="button"
          @click="navigateTo('branch-info')"
          class="hover:underline hover:text-gray-900 transition-colors cursor-pointer"
        >
          {{ t('nav.about') }}
        </button>

        <button
          type="button"
          @click="openContacts"
          class="hover:underline hover:text-gray-900 transition-colors cursor-pointer"
        >
          {{ t('nav.contacts') }}
        </button>
      </div>

      <button
        type="button"
        class="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
        @click="localeStore.toggle"
      >
        <i class="pi pi-globe text-base"></i>
        <span>{{ LOCALE_NAMES[localeStore.locale] }}</span>
      </button>
    </div>
  </div>
</template>
