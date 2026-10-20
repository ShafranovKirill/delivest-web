<script setup lang="ts">
import InputText from 'primevue/inputtext'

export interface AddressForm {
  street: string
  house: string
  apartment: string
  entrance: string
  floor: string
  intercom: string
}

const address = defineModel<AddressForm>({ required: true })
</script>

<template>
  <div class="flex flex-col gap-3 sm:gap-4">
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-gray-600">Улица</span>
      <InputText v-model="address.street" placeholder="Ленина" class="w-full" />
    </label>

    <div class="grid grid-cols-3 gap-2 sm:gap-3">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-gray-600">Дом</span>
        <InputText v-model="address.house" placeholder="10" class="w-full" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-gray-600">Кв / офис</span>
        <InputText v-model="address.apartment" placeholder="12" class="w-full" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-gray-600">Подъезд</span>
        <InputText v-model="address.entrance" placeholder="2" class="w-full" />
      </label>
    </div>

    <div class="grid grid-cols-3 gap-2 sm:gap-3">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-gray-600">Этаж</span>
        <InputText v-model="address.floor" placeholder="3" class="w-full" />
      </label>
      <label class="flex flex-col gap-1.5 col-span-2">
        <span class="text-sm font-medium text-gray-600">Домофон</span>
        <InputText v-model="address.intercom" placeholder="42" class="w-full" />
      </label>
    </div>
  </div>
</template>
