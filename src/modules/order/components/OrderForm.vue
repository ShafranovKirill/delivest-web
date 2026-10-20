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
import { useCartStore } from '@/modules/cart/stores/cart.store'
import type { ClientAddress } from '@/modules/account/api/account.service'
import { useI18n } from 'vue-i18n'

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
const { t } = useI18n()
const branchStore = useBranchStore()
const authStore = useAuthStore()
const cartStore = useCartStore()

const form = reactive<OrderFormValues>({
  customer_name: authStore.client?.name ?? '',
  customer_phone: authStore.client?.phone ?? '+7',
  fulfillment_type: 'pickup',
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

watch(
  () => form.fulfillment_type,
  (type) => cartStore.setFulfillment(type).catch((e) => console.error(e)),
  { immediate: true },
)

const pickupAddress = computed(() => branchStore.activeBranch?.branch_info?.address || null)

const fulfillmentOptions = computed<
  Array<{ value: OrderFormValues['fulfillment_type']; label: string; icon: string }>
>(() => [
  { value: 'delivery', label: t('order.form.delivery'), icon: 'pi-car' },
  { value: 'pickup', label: t('order.form.pickup'), icon: 'pi-shopping-bag' },
  { value: 'dine_in', label: t('order.form.dineIn'), icon: 'pi-home' },
])

const paymentOptions = computed<
  Array<{ value: OrderFormValues['payment_method']; label: string; icon: string }>
>(() => [
  { value: 'cash', label: t('order.form.cash'), icon: 'pi-wallet' },
  { value: 'card_offline', label: t('order.form.card'), icon: 'pi-credit-card' },
])

function handleSubmit() {
  if (!form.customer_phone || form.customer_phone.length < 12) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('order.form.required'),
      life: 3000,
    })
    return
  }

  emit('submit', form)
}
</script>

<template>
  <form class="flex flex-col gap-3 sm:gap-4" @submit.prevent="handleSubmit">
    <SurfaceCard icon="pi-user" :title="t('order.form.contacts')">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-gray-600">{{ t('order.form.name') }}</span>
          <InputText
            v-model="form.customer_name"
            :placeholder="t('order.form.namePlaceholder')"
            class="w-full"
          />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-gray-600">
            {{ t('common.phone') }} <span class="text-red-500">*</span>
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

    <SurfaceCard icon="pi-send" :title="t('order.form.fulfillment')">
      <OptionChips v-model="form.fulfillment_type" :options="fulfillmentOptions" :columns="3" />

      <p
        v-if="form.fulfillment_type === 'pickup' && pickupAddress"
        class="mt-3 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-gray-600 border border-gray-100"
      >
        <i class="pi pi-map-marker text-primary" />
        {{ t('order.form.pickupAt') }}
        <span class="font-semibold text-gray-900">{{ pickupAddress }}</span>
      </p>

      <div v-if="form.fulfillment_type === 'delivery'" class="mt-4 flex flex-col gap-3 sm:gap-4">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox v-model="form.call_operator_for_address" binary />
          <span class="text-sm text-gray-700">{{ t('order.form.callOperator') }}</span>
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

    <OrderTimeSelect v-model="form.cook_by" :fulfillment="form.fulfillment_type" />

    <SurfaceCard icon="pi-wallet" :title="t('order.payment.title')">
      <OptionChips v-model="form.payment_method" :options="paymentOptions" :columns="2" />

      <label class="mt-4 flex flex-col gap-1.5">
        <span class="text-sm font-medium text-gray-600">{{ t('order.form.comment') }}</span>
        <Textarea
          v-model="form.comment"
          rows="3"
          :placeholder="t('order.form.commentPlaceholder')"
          class="w-full resize-none"
        />
      </label>
    </SurfaceCard>

    <Button
      type="submit"
      :label="t('order.form.submit')"
      icon="pi pi-check"
      iconPos="right"
      :loading="isLoading"
      class="w-full h-14 rounded-full! text-base font-semibold"
    />
  </form>
</template>
