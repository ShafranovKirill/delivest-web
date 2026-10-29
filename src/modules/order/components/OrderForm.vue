<script setup lang="ts">
import { reactive, computed, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import OrderConsent from './OrderConsent.vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import PhoneInput from '@/modules/order/components/PhoneInput.vue'
import OrderTimeSelect from '@/modules/order/components/OrderTimeSelect.vue'
import OptionChips from '@/modules/order/components/OptionChips.vue'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'
import FulfillmentSummary from '@/modules/fulfillment/components/FulfillmentSummary.vue'
import type { DeliveryAddress } from '@/modules/fulfillment/utils/deliveryAddress'
import { useFulfillmentStore } from '@/modules/fulfillment/stores/fulfillment.store'
import { useFulfillmentFlowStore } from '@/modules/fulfillment/stores/fulfillmentFlow.store'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useDeliveryQuote } from '@/modules/fulfillment/composables/useDeliveryQuote'
import { useI18n } from 'vue-i18n'

export interface OrderFormValues {
  customer_name: string
  customer_phone: string
  fulfillment_type: 'delivery' | 'pickup' | 'dine_in'
  payment_method: 'cash' | 'card_offline'
  comment: string
  cook_by: string | null
  address: DeliveryAddress | null
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
const authStore = useAuthStore()
const cartStore = useCartStore()
const franchiseStore = useFranchiseStore()
const fulfillmentStore = useFulfillmentStore()
const flowStore = useFulfillmentFlowStore()

type PickupKind = Extract<OrderFormValues['fulfillment_type'], 'pickup' | 'dine_in'>

const pickupKind = ref<PickupKind>('pickup')

const form = reactive({
  customer_name: authStore.client?.name ?? '',
  customer_phone: authStore.client?.phone ?? authStore.lastPhone ?? '+7',
  payment_method: 'cash' as OrderFormValues['payment_method'],
  comment: '',
  cook_by: null as string | null,
  call_operator_for_address: false,
})

const isDelivery = computed(() => fulfillmentStore.current?.type === 'delivery')

const delivery = useDeliveryQuote()

const deliveryBlocked = computed(
  () => isDelivery.value && !form.call_operator_for_address && delivery.blocked.value,
)

const fulfillmentType = computed<OrderFormValues['fulfillment_type']>(() =>
  isDelivery.value ? 'delivery' : pickupKind.value,
)

watch(
  () => authStore.client?.phone,
  (phone) => phone && (form.customer_phone = phone),
)

watch(fulfillmentType, (type) => cartStore.setFulfillment(type).catch((e) => console.error(e)), {
  immediate: true,
})

const pickupOptions = computed<Array<{ value: PickupKind; label: string; icon: string }>>(() => [
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

  if (!fulfillmentStore.current) {
    flowStore.openPicker('delivery')
    return
  }

  if (deliveryBlocked.value) return

  emit('submit', {
    ...form,
    fulfillment_type: fulfillmentType.value,
    address: fulfillmentStore.deliveryAddress,
    call_operator_for_address: isDelivery.value && form.call_operator_for_address,
  })
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
      <FulfillmentSummary with-quote />

      <OptionChips
        v-if="fulfillmentStore.current?.type === 'pickup'"
        v-model="pickupKind"
        :options="pickupOptions"
        :columns="2"
        class="mt-3"
      />

      <label
        v-if="isDelivery && !franchiseStore.addressMap"
        class="mt-3 flex items-center gap-2 cursor-pointer select-none"
      >
        <Checkbox v-model="form.call_operator_for_address" binary />
        <span class="text-sm text-gray-700">{{ t('order.form.callOperator') }}</span>
      </label>
    </SurfaceCard>

    <OrderTimeSelect v-model="form.cook_by" :fulfillment="fulfillmentType" />

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

    <p v-if="deliveryBlocked" class="text-center text-sm font-medium text-red-500">
      {{ delivery.hint.value }}
    </p>
    <Button
      type="submit"
      :label="t('order.form.submit')"
      :disabled="deliveryBlocked"
      icon="pi pi-check"
      iconPos="right"
      :loading="isLoading"
      class="w-full h-14 rounded-full! text-base font-semibold"
    />

    <OrderConsent />
  </form>
</template>
