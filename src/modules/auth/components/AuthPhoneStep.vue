<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import PhoneInput from '@/modules/order/components/PhoneInput.vue'

defineProps<{ loading: boolean }>()
const emit = defineEmits<{ submit: [phone: string] }>()

const phone = ref('+7')
const isComplete = computed(() => phone.value.length === 12)
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="isComplete && emit('submit', phone)">
    <p class="text-sm text-gray-500">
      Введите номер телефона. Чтобы подтвердить его, нужно будет сделать бесплатный звонок — без СМС
      и кодов.
    </p>

    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-gray-600">Телефон</span>
      <PhoneInput v-model="phone" class="w-full h-12" />
    </label>

    <Button
      type="submit"
      label="Продолжить"
      icon="pi pi-arrow-right"
      icon-pos="right"
      :loading="loading"
      :disabled="!isComplete"
      class="h-12 w-full rounded-full! font-semibold"
    />
  </form>
</template>
