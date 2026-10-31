<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import PhoneInput from '@/modules/order/components/PhoneInput.vue'
import AuthConsent from './AuthConsent.vue'
import { PHONE_MASK, formatDisplayPhone } from '@/modules/shared/utils/phoneFormat'
import { useAuthStore } from '../stores/auth.store'
import { formatPhoneNumber } from '@/modules/widgets/contacts/utils/tel-format'
import { useI18n } from 'vue-i18n'

defineProps<{ loading: boolean }>()
const emit = defineEmits<{ submit: [phone: string] }>()
const { t } = useI18n()
const authStore = useAuthStore()

const phone = ref('+7')
const field = ref<HTMLElement | null>(null)
const display = computed(() => formatDisplayPhone(phone.value))
const ghost = computed(() => PHONE_MASK.slice(display.value.length))
const isComplete = computed(() => phone.value.length === 12)

const suggestion = computed(() => {
  const last = authStore.lastPhone
  return last && last.length === 12 && last !== phone.value ? last : null
})

function useSuggestion() {
  if (!suggestion.value) return
  phone.value = suggestion.value
  emit('submit', phone.value)
}

onMounted(() => field.value?.querySelector('input')?.focus())
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="isComplete && emit('submit', phone)">
    <p class="text-sm leading-relaxed text-gray-500">{{ t('auth.phone.hint') }}</p>

    <button
      v-if="suggestion"
      type="button"
      class="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3 text-left transition-colors hover:border-primary cursor-pointer"
      :disabled="loading"
      @click="useSuggestion"
    >
      <span class="grid place-items-center size-9 shrink-0 rounded-full bg-primary-fill text-white">
        <i class="pi pi-history text-sm" />
      </span>
      <span class="flex-1 text-sm font-semibold text-gray-900">
        {{ t('auth.phone.useLast', { phone: formatPhoneNumber(suggestion) }) }}
      </span>
      <i class="pi pi-arrow-right text-primary text-sm" />
    </button>

    <div ref="field" class="relative">
      <div
        class="pointer-events-none absolute inset-0 flex items-center whitespace-pre px-[calc(1rem+1px)] text-xl font-semibold tabular-nums"
        aria-hidden="true"
      >
        <span class="invisible">{{ display }}</span>
        <span class="text-gray-300">{{ ghost }}</span>
      </div>
      <PhoneInput
        v-model="phone"
        placeholder=" "
        class="h-14 w-full rounded-2xl! bg-transparent! px-4! text-xl! font-semibold tabular-nums"
      />
    </div>

    <Button
      type="submit"
      :label="t('common.continue')"
      :loading="loading"
      :disabled="!isComplete"
      class="h-14 w-full rounded-2xl! text-base font-semibold"
    />

    <AuthConsent />
  </form>
</template>
