<script setup lang="ts">
import { computed } from 'vue'
import { openLink } from '@/utils/browser'
import { useContactsStore } from '../contacts/stores/constacts.store'
import BrandLogo from '@/modules/franchise/components/BrandLogo.vue'
import { useI18n } from 'vue-i18n'

const contactsStore = useContactsStore()
const { t } = useI18n()

const socials = computed(() =>
  [
    { url: contactsStore.social.vk, label: t('footer.vk'), icon: null },
    { url: contactsStore.social.instagram, label: t('footer.instagram'), icon: 'pi-instagram' },
    { url: contactsStore.social.whatsapp, label: t('footer.whatsapp'), icon: 'pi-whatsapp' },
  ].filter((social) => social.url),
)
</script>

<template>
  <div class="flex flex-col gap-4 max-w-sm">
    <BrandLogo :fallback="t('footer.ourPlace')" class="h-8 max-w-48 text-2xl" />
    <p class="text-sm text-gray-600 leading-relaxed">{{ t('footer.tagline') }}</p>

    <a
      v-if="contactsStore.phone"
      :href="`tel:${contactsStore.phone}`"
      class="group flex flex-col w-fit"
    >
      <span class="text-xs text-gray-500">{{ t('footer.questions') }}</span>
      <span class="text-lg font-bold text-gray-900 tabular-nums group-hover:text-primary">
        {{ contactsStore.phoneFormatted }}
      </span>
    </a>

    <div v-if="socials.length" class="flex gap-2">
      <button
        v-for="social in socials"
        :key="social.url"
        type="button"
        class="size-10 grid place-items-center rounded-full bg-white text-gray-700 hover:text-primary transition-colors cursor-pointer"
        :aria-label="social.label"
        :title="social.label"
        @click="openLink(social.url)"
      >
        <i v-if="social.icon" :class="['pi', social.icon, 'text-lg']" />
        <i-vk-logo-black v-else class="size-5" />
      </button>
    </div>
  </div>
</template>
