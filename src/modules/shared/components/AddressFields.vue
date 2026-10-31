<script setup lang="ts">
import InputText from 'primevue/inputtext'
import { useI18n } from 'vue-i18n'

export interface AddressForm {
  street: string
  house: string
  apartment: string
  entrance: string
  floor: string
  intercom: string
  comment: string
}

const address = defineModel<AddressForm>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col gap-3 sm:gap-4">
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-gray-600">{{ t('address.street') }}</span>
      <InputText
        v-model="address.street"
        :placeholder="t('address.streetPlaceholder')"
        class="w-full"
      />
    </label>

    <div class="grid grid-cols-3 gap-2 sm:gap-3">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-gray-600">{{ t('address.house') }}</span>
        <InputText v-model="address.house" placeholder="10" class="w-full" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-gray-600">{{ t('address.apartment') }}</span>
        <InputText v-model="address.apartment" placeholder="12" class="w-full" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-gray-600">{{ t('address.entrance') }}</span>
        <InputText v-model="address.entrance" placeholder="2" class="w-full" />
      </label>
    </div>

    <div class="grid grid-cols-3 gap-2 sm:gap-3">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-gray-600">{{ t('address.floor') }}</span>
        <InputText v-model="address.floor" placeholder="3" class="w-full" />
      </label>
      <label class="flex flex-col gap-1.5 col-span-2">
        <span class="text-sm font-medium text-gray-600">{{ t('address.intercom') }}</span>
        <InputText v-model="address.intercom" placeholder="42" class="w-full" />
      </label>
    </div>
  </div>
</template>
