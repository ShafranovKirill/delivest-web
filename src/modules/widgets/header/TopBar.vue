<script setup lang="ts">
import { computed } from 'vue'
import { useBranchNavigation } from '@/modules/branch/composables/useBranchNavigation'
import AccountMenu from '@/modules/auth/components/AccountMenu.vue'
import ThemeToggle from '@/modules/settings/components/ThemeToggle.vue'
import LocaleToggle from '@/modules/settings/components/LocaleToggle.vue'
import { useI18n } from 'vue-i18n'

const navigateTo = useBranchNavigation()
const { t } = useI18n()

const links = computed(() => [
  { label: t('nav.menu'), action: () => navigateTo('menu') },
  { label: t('nav.promotions'), action: () => navigateTo('promotions') },
  { label: t('nav.about'), action: () => navigateTo('branch-info') },
  { label: t('nav.contacts'), action: () => navigateTo('contacts') },
])

const linkClass = 'hover:text-gray-900 transition-colors cursor-pointer'
</script>

<template>
  <div class="w-full bg-gray-200 border-b border-gray-300">
    <div
      class="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center text-sm text-gray-600"
    >
      <nav class="flex gap-5">
        <button
          v-for="link in links"
          :key="link.label"
          type="button"
          :class="linkClass"
          @click="link.action"
        >
          {{ link.label }}
        </button>

        <AccountMenu v-slot="{ open, signedIn }">
          <button
            type="button"
            class="flex items-center gap-1"
            :class="[linkClass, { 'text-primary': signedIn }]"
            @click="open"
          >
            {{ t('nav.account') }}
            <i v-if="signedIn" class="pi pi-angle-down text-xs" />
          </button>
        </AccountMenu>
      </nav>

      <div class="flex items-center gap-3">
        <ThemeToggle :class="linkClass" />
        <span class="h-4 w-px bg-gray-300" />
        <LocaleToggle :class="linkClass" />
      </div>
    </div>
  </div>
</template>
