name=OrderForm.vue
<script setup lang="ts">
import { reactive } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import PhoneInput from '@/modules/order/components/PhoneInput.vue'

interface AddressForm {
  city: string
  street: string
  house: string
  apartment: string
  entrance: string
  floor: string
  intercom: string
}

export interface OrderFormValues {
  customer_name: string
  customer_phone: string
  fulfillment_type: 'delivery' | 'pickup' | 'dine_in'
  payment_method: 'cash' | 'card_offline'
  comment: string
  address: AddressForm
}

defineProps<{
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', form: OrderFormValues): void
}>()

const toast = useToast()

const form = reactive<OrderFormValues>({
  customer_name: '',
  customer_phone: '+7',
  fulfillment_type: 'delivery',
  payment_method: 'cash',
  comment: '',
  address: {
    city: '',
    street: '',
    house: '',
    apartment: '',
    entrance: '',
    floor: '',
    intercom: '',
  },
})

const fulfillmentOptions = [
  { label: 'Доставка', value: 'delivery' },
  { label: 'Самовывоз', value: 'pickup' },
  { label: 'В заведении', value: 'dine_in' },
]

const paymentOptions = [
  { label: 'Наличными', value: 'cash' },
  { label: 'Картой при получении', value: 'card_offline' },
]

function handleSubmit() {
  if (!form.customer_phone || form.customer_phone.length < 12) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Заполните обязательные поля',
      life: 3000,
    })
    return
  }

  emit('submit', form)
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 sm:gap-6">
    <div
      class="bg-card border border-border/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col gap-4"
    >
      <h2 class="text-base sm:text-lg font-semibold">Контактные данные</h2>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-muted-foreground">Ваше имя</label>
        <InputText v-model="form.customer_name" placeholder="Иван" class="w-full" />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-muted-foreground">
          Номер телефона <span class="text-red-500">*</span>
        </label>
        <PhoneInput v-model="form.customer_phone" required class="w-full" />
      </div>
    </div>

    <div
      class="bg-card border border-border/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col gap-4"
    >
      <h2 class="text-base sm:text-lg font-semibold">Способ получения</h2>
      <Select
        v-model="form.fulfillment_type"
        :options="fulfillmentOptions"
        optionLabel="label"
        optionValue="value"
        class="w-full"
      />

      <div v-if="form.fulfillment_type === 'delivery'" class="flex flex-col gap-3 sm:gap-4 mt-2">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-muted-foreground">Город</label>
            <InputText v-model="form.address.city" placeholder="Москва" class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-muted-foreground">Улица</label>
            <InputText v-model="form.address.street" placeholder="Ленина" class="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 sm:gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-muted-foreground">Дом</label>
            <InputText v-model="form.address.house" placeholder="10" class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-muted-foreground">Кв / офис</label>
            <InputText v-model="form.address.apartment" placeholder="12" class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-muted-foreground">Подъезд</label>
            <InputText v-model="form.address.entrance" placeholder="2" class="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 sm:gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-muted-foreground">Этаж</label>
            <InputText v-model="form.address.floor" placeholder="3" class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5 col-span-2">
            <label class="text-xs text-muted-foreground">Домофон</label>
            <InputText v-model="form.address.intercom" placeholder="42" class="w-full" />
          </div>
        </div>
      </div>
    </div>

    <div
      class="bg-card border border-border/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col gap-4"
    >
      <h2 class="text-base sm:text-lg font-semibold">Оплата и комментарий</h2>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-muted-foreground">Способ оплаты</label>
        <Select
          v-model="form.payment_method"
          :options="paymentOptions"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-muted-foreground">Комментарий к заказу</label>
        <Textarea
          v-model="form.comment"
          rows="3"
          placeholder="Например: Без лука"
          class="w-full resize-none"
        />
      </div>
    </div>

    <Button
      type="submit"
      label="Подтвердить и оформить заказ"
      :loading="isLoading"
      class="w-full h-14 rounded-2xl text-base font-semibold"
    />
  </form>
</template>
