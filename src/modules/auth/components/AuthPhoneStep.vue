<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import PhoneInput from '@/modules/order/components/PhoneInput.vue'
import { useAuthStore } from '../stores/auth.store'
import { formatPhoneNumber } from '@/modules/widgets/contacts/utils/tel-format'
import { useI18n } from 'vue-i18n'

defineProps<{ loading: boolean }>()
const emit = defineEmits<{ submit: [phone: string] }>()
const { t } = useI18n()
const authStore = useAuthStore()

const phone = ref('+7')
const field = ref<HTMLElement | null>(null)
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
    <p class="text-sm text-gray-500 leading-relaxed">{{ t('auth.phone.hint') }}</p>

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

    <div ref="field" class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-gray-600">{{ t('common.phone') }}</span>
      <div class="relative">
        <span
          class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 grid place-items-center size-8 rounded-xl bg-gray-100 text-gray-500"
        >
          <i class="pi pi-phone text-sm" />
        </span>
        <PhoneInput
          v-model="phone"
          class="w-full h-14 rounded-2xl! pl-15! pr-12! text-lg! font-semibold tracking-wide tabular-nums"
        />
        <i
          v-if="isComplete"
          class="pi pi-check-circle absolute right-4 top-1/2 -translate-y-1/2 text-xl text-green-700"
        />
      </div>
    </div>

    <Button
      type="submit"
      :label="t('common.continue')"
      icon="pi pi-arrow-right"
      icon-pos="right"
      :loading="loading"
      :disabled="!isComplete"
      class="h-12 w-full rounded-full! font-semibold"
    />
  </form>
</template>
