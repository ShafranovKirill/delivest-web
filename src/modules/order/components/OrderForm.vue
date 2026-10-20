<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import PhoneInput from '@/modules/order/components/PhoneInput.vue'
import OrderTimeSelect from '@/modules/order/components/OrderTimeSelect.vue'
import OptionChips from '@/modules/order/components/OptionChips.vue'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'
import AddressFields, { type AddressForm } from '@/modules/shared/components/AddressFields.vue'
import SavedAddressPicker from '@/modules/order/components/SavedAddressPicker.vue'
import { emptyAddressForm, toAddressForm } from '@/modules/shared/utils/addressForm'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type { ClientAddress } from '@/modules/account/api/account.service'

export interface OrderFormValues {
  customer_name: string
  customer_phone: string
  fulfillment_type: 'delivery' | 'pickup' | 'dine_in'
  payment_method: 'cash' | 'card_offline'
  comment: string
  cook_by: string | null
  address: AddressForm
  call_operator_for_address: boolean
}

defineProps<{
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', form: OrderFormValues): void
}>()

const toast = useToast()
const branchStore = useBranchStore()
const authStore = useAuthStore()

const form = reactive<OrderFormValues>({
  customer_name: authStore.client?.name ?? '',
  customer_phone: authStore.client?.phone ?? '+7',
  fulfillment_type: 'pickup', // По умолчанию самовывоз
  payment_method: 'cash',
  comment: '',
  cook_by: null,
  address: emptyAddressForm(),
  call_operator_for_address: false,
})

function selectAddress(address: ClientAddress) {
  form.address = toAddressForm(address)
}

watch(
  () => authStore.client?.phone,
  (phone) => phone && (form.customer_phone = phone),
)

const pickupAddress = computed(() => branchStore.activeBranch?.branch_info?.address || null)

const fulfillmentOptions: Array<{
  value: OrderFormValues['fulfillment_type']
  label: string
  icon: string
}> = [
  { value: 'delivery', label: 'Доставка', icon: 'pi-car' },
  { value: 'pickup', label: 'Самовывоз', icon: 'pi-shopping-bag' },
  { value: 'dine_in', label: 'В зале', icon: 'pi-home' },
]

const paymentOptions: Array<{
  value: OrderFormValues['payment_method']
  label: string
  icon: string
}> = [
  { value: 'cash', label: 'Наличными', icon: 'pi-wallet' },
  { value: 'card_offline', label: 'Картой', icon: 'pi-credit-card' },
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
  <form class="flex flex-col gap-3 sm:gap-4" @submit.prevent="handleSubmit">
    <SurfaceCard icon="pi-user" title="Контактные данные">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-gray-600">Ваше имя</span>
          <InputText v-model="form.customer_name" placeholder="Иван" class="w-full" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-gray-600">
            Телефон <span class="text-red-500">*</span>
          </span>
          <PhoneInput
            v-model="form.customer_phone"
            required
            :disabled="authStore.isAuthenticated"
            class="w-full"
          />
        </label>
      </div>
    </SurfaceCard>

    <SurfaceCard icon="pi-send" title="Способ получения">
      <OptionChips v-model="form.fulfillment_type" :options="fulfillmentOptions" :columns="3" />

      <p
        v-if="form.fulfillment_type === 'pickup' && pickupAddress"
        class="mt-3 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-gray-600 border border-gray-100"
      >
        <i class="pi pi-map-marker text-primary" />
        Забрать по адресу: <span class="font-semibold text-gray-900">{{ pickupAddress }}</span>
      </p>

      <div v-if="form.fulfillment_type === 'delivery'" class="mt-4 flex flex-col gap-3 sm:gap-4">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox v-model="form.call_operator_for_address" binary />
          <span class="text-sm text-gray-700">Назову адрес оператору по телефону</span>
        </label>

        <template v-if="!form.call_operator_for_address">
          <SavedAddressPicker
            v-if="authStore.isAuthenticated"
            :current="form.address"
            @select="selectAddress"
          />
          <AddressFields v-model="form.address" />
        </template>
      </div>
    </SurfaceCard>

    <OrderTimeSelect v-model="form.cook_by" />

    <SurfaceCard icon="pi-wallet" title="Оплата">
      <OptionChips v-model="form.payment_method" :options="paymentOptions" :columns="2" />

      <label class="mt-4 flex flex-col gap-1.5">
        <span class="text-sm font-medium text-gray-600">Комментарий к заказу</span>
        <Textarea
          v-model="form.comment"
          rows="3"
          placeholder="Например: без лука"
          class="w-full resize-none"
        />
      </label>
    </SurfaceCard>

    <Button
      type="submit"
      label="Оформить заказ"
      icon="pi pi-check"
      iconPos="right"
      :loading="isLoading"
      class="w-full h-14 rounded-full! text-base font-semibold"
    />
  </form>
</template>
