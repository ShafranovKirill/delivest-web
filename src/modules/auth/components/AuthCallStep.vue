<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { copyText } from '@/utils/clipboard'
import { formatPhoneNumber } from '@/modules/widgets/contacts/utils/tel-format'

const props = defineProps<{ callNumber: string; phone: string; secondsLeft: number }>()
defineEmits<{ back: [] }>()

const toast = useToast()

const timeLeft = computed(() => {
  const minutes = Math.floor(props.secondsLeft / 60)
  const seconds = String(props.secondsLeft % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
})

async function copyNumber() {
  await copyText(props.callNumber)
  toast.add({ severity: 'success', summary: 'Номер скопирован', life: 2000 })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-gray-500">
      Позвоните с номера
      <span class="font-semibold text-gray-900 whitespace-nowrap">{{
        formatPhoneNumber(phone)
      }}</span>
      на номер ниже. Звонок бесплатный и сбросится автоматически.
    </p>

    <div class="rounded-3xl bg-gray-50 border border-gray-100 p-5 text-center">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Номер для подтверждения
      </p>
      <p class="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 tabular-nums">
        {{ formatPhoneNumber(callNumber) }}
      </p>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <Button
        as="a"
        :href="`tel:${callNumber}`"
        label="Позвонить"
        icon="pi pi-phone"
        class="h-12 rounded-full! font-semibold"
      />
      <Button
        label="Скопировать"
        icon="pi pi-clone"
        severity="secondary"
        class="h-12 rounded-full! font-semibold"
        @click="copyNumber"
      />
    </div>

    <div class="flex items-center justify-center gap-2 text-sm text-gray-500">
      <i class="pi pi-spin pi-spinner text-primary" />
      <span>Ждём ваш звонок · {{ timeLeft }}</span>
    </div>

    <button
      type="button"
      class="text-sm font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer"
      @click="$emit('back')"
    >
      Изменить номер
    </button>
  </div>
</template>
