<script setup lang="ts">
import { reactive, computed, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import OrderConsent from './OrderConsent.vue'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import PhoneInput from '@/modules/order/components/PhoneInput.vue'
import OrderTimeSelect from '@/modules/order/components/OrderTimeSelect.vue'
import OptionChips from '@/modules/order/components/OptionChips.vue'
import OrderPickRow from '@/modules/order/components/OrderPickRow.vue'
import Dialog from 'primevue/dialog'
import { formatAddress } from '@/modules/shared/utils/address'
import type { DeliveryAddress } from '@/modules/fulfillment/utils/deliveryAddress'
import { useFulfillmentStore } from '@/modules/fulfillment/stores/fulfillment.store'
import { useFulfillmentFlowStore } from '@/modules/fulfillment/stores/fulfillmentFlow.store'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useDeliveryQuote } from '@/modules/fulfillment/composables/useDeliveryQuote'
import { useI18n } from 'vue-i18n'
import { formatPrice } from '@/utils/money'

export interface OrderFormValues {
  customer_name: string
  customer_phone: string
  fulfillment_type: 'delivery' | 'pickup' | 'dine_in'
  payment_method: 'cash' | 'card_offline' | 'online'
  cash_given: number | null
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
const branchStore = useBranchStore()
const franchiseStore = useFranchiseStore()
const fulfillmentStore = useFulfillmentStore()
const flowStore = useFulfillmentFlowStore()

type PickupKind = Extract<OrderFormValues['fulfillment_type'], 'pickup' | 'dine_in'>

const pickupKind = ref<PickupKind>('pickup')

const form = reactive({
  customer_name: authStore.client?.name ?? '',
  customer_phone: authStore.client?.phone ?? authStore.lastPhone ?? '+7',
  payment_method: 'cash' as OrderFormValues['payment_method'],
  cash_given: null as number | null,
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

const pickupOptions = computed<Array<{ value: PickupKind; label: string }>>(() => [
  { value: 'pickup', label: t('order.form.takeaway') },
  { value: 'dine_in', label: t('order.form.dineIn') },
])

const allPaymentOptions = computed<
  Array<{ value: OrderFormValues['payment_method']; label: string }>
>(() => [
  { value: 'cash', label: t('order.payment.cash') },
  { value: 'card_offline', label: t('order.payment.card_offline') },
  { value: 'online', label: t('order.payment.online') },
])

const paymentOptions = computed(() => {
  const enabled = branchStore.activeBranch?.branch_info?.payment_methods ?? ['cash', 'card_offline']
  return allPaymentOptions.value.filter((option) => enabled.includes(option.value))
})

watch(
  paymentOptions,
  (options) => {
    if (options.length && !options.some((option) => option.value === form.payment_method)) {
      form.payment_method = options[0]!.value
    }
  },
  { immediate: true },
)

const paymentOpen = ref(false)

const paymentLabel = computed(() => t(`order.payment.${form.payment_method}`))

function pickPayment(method: OrderFormValues['payment_method']) {
  form.payment_method = method
  paymentOpen.value = false
}

const headline = computed(() => {
  if (fulfillmentType.value === 'delivery') return t('order.form.headlineDelivery')
  return fulfillmentType.value === 'dine_in'
    ? t('order.form.headlineDineIn')
    : t('order.form.headlinePickup')
})

const addressCaption = computed(() =>
  isDelivery.value ? t('order.form.addressDelivery') : t('order.form.addressPickup'),
)

const addressRow = computed(() => {
  const choice = fulfillmentStore.current
  if (!choice) return { title: t('fulfillment.summary.empty'), text: null }
  if (choice.type === 'pickup') {
    return {
      title: fulfillmentType.value === 'dine_in' ? t('order.form.dineIn') : t('order.form.pickup'),
      text: branchStore.activeBranch?.branch_info?.address ?? branchStore.activeBranch?.name,
    }
  }
  return {
    title: t('order.form.delivery'),
    text: [formatAddress(choice.address), choice.address.comment].filter(Boolean).join(' · '),
  }
})

function openAddressPicker() {
  flowStore.openPicker(fulfillmentStore.current?.type ?? 'delivery')
}

const BANKNOTES = [500, 1000, 2000, 5000]
const changeOpen = ref(false)

const changeOptions = computed(() =>
  BANKNOTES.map((rubles) => rubles * 100).filter((kopecks) => kopecks > cartStore.totalAmount),
)

watch(
  () => form.payment_method,
  (method) => {
    if (method !== 'cash') {
      form.cash_given = null
      changeOpen.value = false
    }
  },
)

function pickChange(kopecks: number | null) {
  form.cash_given = form.cash_given === kopecks ? null : kopecks
}

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
    cash_given: form.payment_method === 'cash' ? form.cash_given : null,
    fulfillment_type: fulfillmentType.value,
    address: fulfillmentStore.deliveryAddress,
    call_operator_for_address: isDelivery.value && form.call_operator_for_address,
  })
}
</script>

<template>
  <form class="flex flex-col gap-6" @submit.prevent="handleSubmit">
    <h2 class="text-2xl font-extrabold text-gray-950">{{ headline }}</h2>

    <div>
      <p class="mb-2 text-sm font-semibold text-gray-500">{{ t('order.form.phoneCaption') }}</p>
      <PhoneInput
        v-model="form.customer_phone"
        required
        :disabled="authStore.isAuthenticated"
        class="w-full"
      />
    </div>

    <div>
      <p class="mb-2 text-sm font-semibold text-gray-500">{{ addressCaption }}</p>
      <OrderPickRow :title="addressRow.title" :text="addressRow.text" @click="openAddressPicker" />

      <p
        v-if="isDelivery && delivery.hint.value"
        class="mt-2 text-sm font-medium"
        :class="delivery.blocked.value ? 'text-red-500' : 'text-gray-700'"
      >
        {{ delivery.hint.value }}
      </p>

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
    </div>

    <OrderTimeSelect v-model="form.cook_by" :fulfillment="fulfillmentType" />

    <div>
      <p class="mb-2 text-sm font-semibold text-gray-500">{{ t('order.form.paymentCaption') }}</p>
      <OrderPickRow :title="paymentLabel" @click="paymentOpen = true" />

      <div v-if="form.payment_method === 'cash' && changeOptions.length" class="mt-3">
        <button
          type="button"
          class="text-sm font-medium text-primary cursor-pointer"
          @click="changeOpen = !changeOpen"
        >
          {{
            form.cash_given
              ? t('order.form.changeFrom', { amount: formatPrice(form.cash_given) })
              : t('order.form.changeAsk')
          }}
        </button>
        <div v-if="changeOpen" class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="kopecks in changeOptions"
            :key="kopecks"
            type="button"
            class="rounded-full border px-3 py-1.5 text-sm font-semibold cursor-pointer"
            :class="
              form.cash_given === kopecks
                ? 'border-primary-fill bg-primary-fill text-white'
                : 'border-gray-200 bg-white text-gray-700'
            "
            @click="pickChange(kopecks)"
          >
            {{ formatPrice(kopecks) }}
          </button>
          <button
            type="button"
            class="rounded-full border px-3 py-1.5 text-sm font-semibold cursor-pointer"
            :class="
              form.cash_given === null
                ? 'border-primary-fill bg-primary-fill text-white'
                : 'border-gray-200 bg-white text-gray-700'
            "
            @click="form.cash_given = null"
          >
            {{ t('order.form.noChange') }}
          </button>
        </div>
      </div>
    </div>

    <label class="flex flex-col gap-2">
      <span class="text-sm font-semibold text-gray-500">{{ t('order.form.comment') }}</span>
      <Textarea
        v-model="form.comment"
        rows="3"
        :placeholder="t('order.form.commentPlaceholder')"
        class="w-full resize-none"
      />
    </label>

    <Dialog
      v-model:visible="paymentOpen"
      modal
      :dismissableMask="true"
      :draggable="false"
      class="w-[min(92vw,420px)]"
      :pt="{ root: { class: 'rounded-4xl! overflow-hidden' } }"
    >
      <template #header>
        <h3 class="text-xl font-extrabold text-gray-950">{{ t('order.form.paymentCaption') }}</h3>
      </template>
      <div class="flex flex-col gap-2">
        <button
          v-for="option in paymentOptions"
          :key="option.value"
          type="button"
          class="flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left font-semibold transition-colors cursor-pointer"
          :class="
            form.payment_method === option.value
              ? 'border-primary-fill bg-primary-fill text-white'
              : 'border-gray-200 bg-white text-gray-800 hover:border-primary'
          "
          @click="pickPayment(option.value)"
        >
          <span>{{ option.label }}</span>
          <i v-if="form.payment_method === option.value" class="pi pi-check text-sm" />
        </button>
      </div>
    </Dialog>

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
