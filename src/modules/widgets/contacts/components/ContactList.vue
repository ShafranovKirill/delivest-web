<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { openLink } from '@/utils/browser'
import { useContactsStore } from '../stores/constacts.store'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{ variant?: 'card' | 'directory' }>(), {
  variant: 'card',
})

const contactsStore = useContactsStore()
const toast = useToast()
const { t } = useI18n()

const socials = computed(() =>
  [
    { key: 'whatsapp', url: contactsStore.social.whatsapp, label: 'WhatsApp', icon: 'pi-whatsapp' },
    { key: 'vk', url: contactsStore.social.vk, label: t('branch.info.vk'), icon: null },
    {
      key: 'instagram',
      url: contactsStore.social.instagram,
      label: 'Instagram',
      icon: 'pi-instagram',
    },
  ].filter((item) => Boolean(item.url)),
)

const hasContacts = computed(() => Boolean(contactsStore.phone) || socials.value.length > 0)

const handleCopy = async () => {
  if (await contactsStore.copyPhoneNumber()) {
    toast.add({
      severity: 'success',
      summary: t('contacts.copied'),
      detail: t('contacts.phoneCopied'),
      life: 3000,
    })
  }
}
</script>

<template>
  <div v-if="hasContacts" :class="props.variant === 'directory' ? 'mt-3' : 'flex flex-col gap-2'">
    <div
      v-if="contactsStore.phone"
      class="flex items-center gap-3"
      :class="
        props.variant === 'directory'
          ? 'border-b border-gray-200 py-3'
          : 'rounded-3xl bg-gray-50 border border-gray-100 p-3'
      "
    >
      <button
        type="button"
        class="flex flex-1 items-center gap-3 min-w-0 text-left cursor-pointer group"
        @click="contactsStore.makeCall"
      >
        <span
          v-if="props.variant === 'card'"
          class="grid place-items-center size-11 shrink-0 rounded-2xl bg-primary-fill text-white"
        >
          <i class="pi pi-phone" />
        </span>
        <span class="min-w-0">
          <span class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {{ t('common.call') }}
          </span>
          <span
            class="block font-bold text-gray-900 group-hover:text-primary transition-colors"
            :class="props.variant === 'directory' ? 'break-all' : 'truncate'"
          >
            {{ contactsStore.phoneFormatted }}
          </span>
        </span>
      </button>
      <button
        type="button"
        class="grid place-items-center size-10 shrink-0 rounded-full text-gray-500 hover:text-primary transition-colors cursor-pointer"
        :class="props.variant === 'card' ? 'bg-white shadow-xs' : 'border border-gray-200'"
        :aria-label="t('contacts.copyPhone')"
        @click="handleCopy"
      >
        <i class="pi pi-clone" />
      </button>
    </div>

    <button
      v-for="social in socials"
      :key="social.key"
      type="button"
      class="group flex w-full items-center gap-3 text-left cursor-pointer transition-colors"
      :class="
        props.variant === 'directory'
          ? 'border-b border-gray-200 py-4'
          : 'rounded-3xl bg-gray-50 border border-gray-100 p-3 hover:border-primary'
      "
      @click="openLink(social.url)"
    >
      <span
        v-if="props.variant === 'card'"
        class="grid place-items-center size-11 shrink-0 rounded-2xl bg-white text-primary shadow-xs"
      >
        <i-vk-logo-black v-if="social.key === 'vk'" class="size-5" />
        <i v-else :class="['pi', social.icon, 'text-lg']" />
      </span>
      <span class="flex-1 font-bold text-gray-900 group-hover:text-primary transition-colors">
        {{ social.label }}
      </span>
      <i class="pi pi-arrow-up-right text-sm text-gray-400" />
    </button>
  </div>

  <p v-else class="py-6 text-gray-500" :class="{ 'text-center': props.variant === 'card' }">
    {{ t('contacts.empty') }}
  </p>
</template>
