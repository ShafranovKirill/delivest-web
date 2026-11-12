<script setup lang="ts">
import LoyaltyEarnings from '@/modules/account/components/LoyaltyEarnings.vue'

import { reactive, computed, ref, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import OrderConsent from './OrderConsent.vue'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import PhoneInput from '@/modules/order/components/PhoneInput.vue'
import OrderTimeSelect from '@/modules/order/components/OrderTimeSelect.vue'
import OptionChips from '@/modules/order/components/OptionChips.vue'
import { captionClass, sectionClass } from '@/modules/order/utils/formLayout'
import OrderPickRow from '@/modules/order/components/OrderPickRow.vue'
import Dialog from 'primevue/dialog'
import { useBranchOpening } from '@/modules/branch/composables/useBranchOpening'
import { addDays } from '@/modules/branch/utils/workWindow'
import { formatClock, sameDay } from '@/modules/branch/utils/zonedTime'
import { intlLocale } from '@/i18n'
import { formatAddress } from '@/modules/shared/utils/address'
import type { DeliveryAddress } from '@/modules/fulfillment/utils/deliveryAddress'
import { emptyDeliveryAddress } from '@/modules/fulfillment/utils/deliveryAddress'
import DeliveryAddressForm from '@/modules/fulfillment/components/delivery/DeliveryAddressForm.vue'
import { useFulfillmentStore } from '@/modules/fulfillment/stores/fulfillment.store'
import { useFulfillmentFlowStore } from '@/modules/fulfillment/stores/fulfillmentFlow.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useDeliveryQuote } from '@/modules/fulfillment/composables/useDeliveryQuote'
import { useI18n } from 'vue-i18n'
import { formatPrice } from '@/utils/money'
import { useLoyaltyQuery } from '@/modules/account/composables/useLoyaltyQuery'
import { useStarsLabel } from '@/modules/account/composables/useStarsLabel'
import OrderComposition from './OrderComposition.vue'

export interface OrderFormValues {
  customer_name: string
  customer_phone: string
  fulfillment_type: 'delivery' | 'pickup' | 'dine_in'
  payment_method: 'cash' | 'card_offline' | 'online'
  cash_given: number | null
  spend_points: number
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
  (e: 'back'): void
}>()

const toast = useToast()
const { t } = useI18n()
const authStore = useAuthStore()
const cartStore = useCartStore()
const branchStore = useBranchStore()
const fulfillmentStore = useFulfillmentStore()
const flowStore = useFulfillmentFlowStore()
const phoneSection = ref<HTMLElement | null>(null)
const phoneError = ref(false)
const addressSection = ref<HTMLElement | null>(null)
const addressError = ref(false)
const phoneInputClass = computed(() =>
  [
    'w-full lg:max-w-sm rounded-2xl! border-2! bg-gray-50! px-4! py-3.5! text-gray-900!',
    phoneError.value
      ? 'border-red-500! hover:border-red-500! focus:border-red-500!'
      : 'border-gray-100! hover:border-primary! focus:border-primary!',
  ].join(' '),
)
const compositionOpen = ref(false)

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
const draftKey = 'checkout-draft'
const draftOwner = () => authStore.client?.id ?? 'guest'

const loyalty = useLoyaltyQuery()
const starsLabel = useStarsLabel()

const isDelivery = computed(() => fulfillmentStore.current?.type === 'delivery')
const hasMap = computed(() => branchStore.mapAddress)
const showOperatorCheckbox = computed(() => isDelivery.value && branchStore.operatorAddress)
const authenticatedPhone = computed(() => {
  const phone = authStore.client?.phone
  return authStore.isAuthenticated && phone && /^\+7\d{10}$/.test(phone) ? phone : null
})

const delivery = useDeliveryQuote()

const deliveryBlocked = computed(
  () => isDelivery.value && !form.call_operator_for_address && delivery.blocked.value,
)

// Inline address entry is shown when the branch disabled the address map.
const needsAddressEntry = computed(() => isDelivery.value && !hasMap.value)

const inlineAddress = computed<DeliveryAddress>(() =>
  fulfillmentStore.current?.type === 'delivery'
    ? (fulfillmentStore.current.address ?? emptyDeliveryAddress(branchStore.activeBranch?.branch_info?.city ?? ''))
    : emptyDeliveryAddress(branchStore.activeBranch?.branch_info?.city ?? ''),
)

const inlineAddressMissing = computed(
  () =>
    needsAddressEntry.value &&
    !form.call_operator_for_address &&
    !inlineAddress.value.street.trim(),
)

watch(
  () => fulfillmentStore.addressByOperator,
  (value) => { form.call_operator_for_address = value },
  { immediate: true, flush: 'sync' },
)
watch(
  () => form.call_operator_for_address,
  (value) => {
    if (value === fulfillmentStore.addressByOperator) return
    const branchId = branchStore.activeBranch?.id
    const choice = fulfillmentStore.current
    if (!branchId || choice?.type !== 'delivery') return
    if (value && !showOperatorCheckbox.value) {
      form.call_operator_for_address = false
      return
    }
    fulfillmentStore.choose(branchId, { ...choice, addressByOperator: value })
  },
  { flush: 'sync' },
)

watch(inlineAddressMissing, (missing) => {
  if (!missing) addressError.value = false
})

const fulfillmentType = computed<OrderFormValues['fulfillment_type']>(() =>
  isDelivery.value ? 'delivery' : pickupKind.value,
)

watch(
  authenticatedPhone,
  (phone) => {
    if (phone) form.customer_phone = phone
  },
  { immediate: true },
)
watch(
  () => form.customer_phone,
  () => {
    phoneError.value = false
  },
)

const pickupOptions = computed<Array<{ value: PickupKind; label: string }>>(() =>
  (
    [
      { value: 'pickup', label: t('order.form.takeaway') },
      { value: 'dine_in', label: t('order.form.dineIn') },
    ] as Array<{ value: PickupKind; label: string }>
  ).filter((option) => fulfillmentStore.methods.includes(option.value)),
)
watch(
  pickupOptions,
  (options) => {
    if (!options.some((option) => option.value === pickupKind.value) && options[0])
      pickupKind.value = options[0].value
  },
  { immediate: true },
)
watch(fulfillmentType, (type) => cartStore.setFulfillment(type).catch((e) => console.error(e)), {
  immediate: true,
})
onMounted(() => branchStore.refreshBranches().catch(console.error))

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

const { isOpen, isPaused, opensAt, now } = useBranchOpening()

const closedNotice = computed(() => {
  if (isOpen.value || isPaused.value) return null

  const date = opensAt.value
  if (!date) return null

  const time = formatClock(date, intlLocale(), { hour: '2-digit', minute: '2-digit' })
  if (sameDay(date, now.value)) {
    return t('order.form.closed.today', { time })
  }
  if (sameDay(date, addDays(now.value, 1))) {
    return t('order.form.closed.tomorrow', { time })
  }
  const day = formatClock(date, intlLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
  return t('order.form.closed.later', { day, time })
})

const goodsLabel = computed(() => {
  const count = cartStore.totalQuantity
  const rule = new Intl.PluralRules(intlLocale()).select(count)
  return t(`order.form.goods.${rule}`, { count })
})

const deliveryFee = computed(() => (isDelivery.value ? delivery.price.value : null))
const loyaltyRate = computed(() => branchStore.activeBranch?.branch_info?.loyalty)
const useStars = ref(false)
let restoredCartId: string | null = null
watch(
  [() => authStore.sessionEpoch, () => authStore.client?.id],
  () => {
    restoredCartId = null
    form.customer_name = authStore.client?.name ?? ''
    form.customer_phone = authStore.client?.phone ?? '+7'
    form.comment = ''
    form.cook_by = null
    form.cash_given = null
    useStars.value = false
    try {
      sessionStorage.removeItem(draftKey)
    } catch {
      /* Storage is optional. */
    }
  },
  { flush: 'sync' },
)
watch(
  [() => cartStore.cart?.id, () => branchStore.activeBranch?.id],
  ([cartId, branchId]) => {
    if (!authStore.isRequired || !cartId || !branchId || cartId === restoredCartId) return
    restoredCartId = cartId
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) ?? 'null')
      if (
        saved?.owner === draftOwner() &&
        saved?.branchId === branchId &&
        saved?.cartId === cartId
      ) {
        const savedForm = { ...saved.form }
        delete savedForm.call_operator_for_address
        Object.assign(form, savedForm)
        if (saved.pickupKind === 'pickup' || saved.pickupKind === 'dine_in') {
          pickupKind.value = saved.pickupKind
        }
        useStars.value = saved.useStars === true
      } else if (saved) {
        sessionStorage.removeItem(draftKey)
      }
    } catch {
      // Checkout remains available when storage is unavailable.
    }
  },
  { immediate: true },
)
watch(
  [form, pickupKind, useStars],
  () => {
    if (!authStore.isRequired || !cartStore.cart?.id || !branchStore.activeBranch?.id) return
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({
          owner: draftOwner(),
          branchId: branchStore.activeBranch?.id,
          cartId: cartStore.cart?.id,
          form,
          pickupKind: pickupKind.value,
          useStars: useStars.value,
        }),
      )
    } catch {
      // Checkout remains available when storage is unavailable.
    }
  },
  { deep: true },
)
const maxStars = computed(() => {
  const rate = loyaltyRate.value
  if (!rate?.spend_enabled || !rate.max_percent || !loyalty.data.value?.enabled) return 0
  const cap = Math.floor(Math.floor((cartStore.totalAmount * rate.max_percent) / 100) / 100)
  return Math.max(
    Math.min(
      cap,
      Math.max(
        loyalty.data.value.balance -
          cartStore.items.reduce((sum, item) => sum + (item.stars_price ?? 0) * item.quantity, 0),
        0,
      ),
    ),
    0,
  )
})
const starsToSpend = computed(() => (useStars.value ? maxStars.value : 0))
const orderTotal = computed(
  () => cartStore.totalAmount - starsToSpend.value * 100 + (deliveryFee.value ?? 0),
)

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
    text: fulfillmentStore.addressByOperator
      ? t('order.addressByOperator')
      : choice.address
        ? [formatAddress(choice.address), choice.address.comment].filter(Boolean).join(' · ')
        : '',
  }
})

function openAddressPicker() {
  flowStore.openPicker(fulfillmentStore.current?.type ?? 'delivery')
}

function updateInlineAddress(address: DeliveryAddress) {
  const branchId = branchStore.activeBranch?.id
  if (branchId) fulfillmentStore.choose(branchId, { type: 'delivery', address, addressByOperator: false })
}

function handleSubmit() {
  if (authStore.isRequired && !authStore.isAuthenticated) {
    if (authStore.isEnabled) {
      authStore.openModal()
    } else {
      toast.add({
        severity: 'error',
        summary: t('common.error'),
        detail: t('order.authUnavailable'),
        life: 5000,
      })
    }
    return
  }

  const customerPhone = authenticatedPhone.value ?? form.customer_phone
  if (!/^\+7\d{10}$/.test(customerPhone)) {
    phoneError.value = true
    requestAnimationFrame(() => {
      const input = phoneSection.value?.querySelector<HTMLInputElement>('input[name="phone"]')
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input?.focus()
    })
    return
  }

  if (!fulfillmentStore.canOrder) return

  if (!fulfillmentStore.current) {
    flowStore.openPicker('delivery')
    return
  }

  if (deliveryBlocked.value) return

  if (inlineAddressMissing.value) {
    addressError.value = true
    requestAnimationFrame(() => {
      const input = addressSection.value?.querySelector<HTMLInputElement>('input')
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input?.focus()
    })
    return
  }

  const callOperator = showOperatorCheckbox.value && form.call_operator_for_address
  const address =
    isDelivery.value && !callOperator ? (fulfillmentStore.deliveryAddress ?? null) : null

  emit('submit', {
    ...form,
    customer_phone: customerPhone,
    cash_given: null,
    spend_points: starsToSpend.value,
    fulfillment_type: fulfillmentType.value,
    address,
    call_operator_for_address: isDelivery.value && callOperator,
  })
}
</script>

<template>
  <form class="flex flex-col gap-6" novalidate @submit.prevent="handleSubmit">
    <h2 class="text-2xl font-extrabold text-gray-950">{{ headline }}</h2>

    <div v-if="!authenticatedPhone" ref="phoneSection" :class="sectionClass">
      <p :class="captionClass">{{ t('order.form.phoneCaption') }}</p>
      <PhoneInput
        v-model="form.customer_phone"
        required
        :class="phoneInputClass"
        :invalid="phoneError"
      />
      <p v-if="phoneError" class="text-sm font-medium text-red-600" role="alert">
        {{ t('order.form.phoneError') }}
      </p>
    </div>

    <div ref="addressSection" :class="sectionClass">
      <p :class="captionClass">{{ addressCaption }}</p>

      <DeliveryAddressForm
        v-if="needsAddressEntry && !form.call_operator_for_address"
        :model-value="inlineAddress"
        :suggest="false"
        :city="branchStore.activeBranch?.branch_info?.city ?? null"
        @update:model-value="updateInlineAddress"
      />

      <OrderPickRow
        v-else
        :title="addressRow.title"
        :text="addressRow.text"
        @click="openAddressPicker"
      />

      <p
        v-if="addressError && inlineAddressMissing"
        class="mt-2 text-sm font-medium text-red-600"
        role="alert"
      >
        {{ t('order.form.addressError') }}
      </p>

      <p v-if="closedNotice" class="mt-2 text-sm font-medium text-amber-700">
        {{ closedNotice }}
      </p>

      <p
        v-if="isDelivery && delivery.pending.value && !form.call_operator_for_address"
        class="mt-2 text-sm font-medium text-gray-600"
        role="status"
      >
        {{ t('delivery.checking') }}
      </p>
      <p
        v-if="isDelivery && delivery.hint.value && !needsAddressEntry"
        class="mt-2 text-sm font-medium"
        :class="delivery.blocked.value ? 'text-red-500' : 'text-gray-700'"
      >
        {{ delivery.hint.value }}
      </p>

      <OptionChips
        v-if="fulfillmentStore.current?.type === 'pickup' && pickupOptions.length > 1"
        v-model="pickupKind"
        :options="pickupOptions"
        :columns="2"
        class="mt-3"
      />

      <label
        v-if="showOperatorCheckbox"
        class="mt-3 flex items-center gap-2 cursor-pointer select-none"
      >
        <Checkbox v-model="form.call_operator_for_address" binary />
        <span class="text-sm text-gray-700">{{ t('order.form.callOperator') }}</span>
      </label>
    </div>

    <OrderTimeSelect v-model="form.cook_by" :fulfillment="fulfillmentType" />

    <div :class="sectionClass">
      <p :class="captionClass">{{ t('order.form.paymentCaption') }}</p>
      <OrderPickRow :title="paymentLabel" @click="paymentOpen = true" />
    </div>

    <label
      class="flex flex-col gap-2 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-x-6 lg:gap-y-0"
    >
      <span :class="captionClass">{{ t('order.form.comment') }}</span>
      <Textarea
        v-model="form.comment"
        rows="1"
        auto-resize
        :placeholder="t('order.form.commentPlaceholder')"
        class="w-full resize-none rounded-2xl! border-2! border-gray-100! bg-gray-50! px-4! py-3.5! text-gray-900! placeholder:text-gray-500! hover:border-primary! focus:border-primary!"
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
          class="flex items-center justify-between rounded-2xl border-2 px-4 py-3.5 text-left font-semibold transition-colors cursor-pointer"
          :class="
            form.payment_method === option.value
              ? 'border-primary-fill bg-white text-gray-950'
              : 'border-gray-100 bg-gray-50 text-gray-800 hover:border-primary'
          "
          @click="pickPayment(option.value)"
        >
          <span>{{ option.label }}</span>
          <i v-if="form.payment_method === option.value" class="pi pi-check text-sm" />
        </button>
      </div>
    </Dialog>

    <label
      v-if="maxStars > 0"
      id="spend-stars"
      class="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3.5"
    >
      <span class="flex items-center gap-2 font-semibold text-amber-800">
        <i class="pi pi-star-fill" />
        {{ t('loyalty.spend', { stars: starsLabel(maxStars) }) }}
      </span>
      <ToggleSwitch v-model="useStars" />
    </label>

    <div class="lg:hidden">
      <button
        type="button"
        class="mb-3 flex w-full items-center justify-between rounded-2xl bg-gray-100 px-4 py-3 text-left font-semibold"
        :aria-expanded="compositionOpen"
        @click="compositionOpen = !compositionOpen"
      >
        <span>{{ goodsLabel }}</span>
        <i :class="compositionOpen ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" />
      </button>
      <OrderComposition v-if="compositionOpen" class="mb-3" />
      <div class="flex flex-col gap-1.5 text-sm text-gray-600">
        <div v-if="cartStore.discountAmount > 0" class="flex justify-between text-green-700">
          <span>{{ t('cart.discount') }}</span>
          <span class="tabular-nums">−{{ formatPrice(cartStore.discountAmount) }}</span>
        </div>
        <div v-if="starsToSpend > 0" class="flex justify-between text-amber-700">
          <span>{{ t('loyalty.spent') }}</span>
          <span class="tabular-nums">−{{ formatPrice(starsToSpend * 100) }}</span>
        </div>
        <div v-if="deliveryFee !== null" class="flex justify-between">
          <span>{{ t('delivery.line') }}</span>
          <span class="tabular-nums">
            {{ deliveryFee ? formatPrice(deliveryFee) : t('common.free') }}
          </span>
        </div>
        <div class="flex justify-between text-lg font-extrabold text-gray-950">
          <span>{{ t('order.form.orderTotal') }}</span>
          <span class="tabular-nums">{{ formatPrice(orderTotal) }}</span>
        </div>
      </div>
    </div>

    <p v-if="!fulfillmentStore.canOrder" class="text-center text-sm font-medium text-red-500">
      {{ t('errors.codes.fulfillment_unavailable') }}
    </p>
    <p v-if="deliveryBlocked" class="text-center text-sm font-medium text-red-500">
      {{ delivery.hint.value }}
    </p>
    <div class="flex items-center gap-3">
      <div class="hidden shrink-0 md:block">
        <Button
          type="button"
          :label="t('order.form.backToCart')"
          icon="pi pi-angle-left"
          variant="text"
          severity="secondary"
          class="h-14 rounded-full! text-base font-semibold"
          @click="emit('back')"
        />
      </div>
      <Button
        type="submit"
        :label="t('order.form.submit')"
        :disabled="deliveryBlocked || !fulfillmentStore.canOrder"
        icon="pi pi-check"
        iconPos="right"
        :loading="isLoading"
        class="min-w-0 flex-1 h-14 rounded-full! text-base font-semibold"
      />
    </div>

    <LoyaltyEarnings :spend-points="starsToSpend" />
    <OrderConsent />
  </form>
</template>
