<script setup lang="ts">
import LoyaltyEarnings from '@/modules/account/components/LoyaltyEarnings.vue'
import courierIcon from '@/assets/icons/fulfillment/courier.png'
import restaurantIcon from '@/assets/icons/fulfillment/restaurant.png'

import { reactive, computed, ref, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import OrderConsent from './OrderConsent.vue'
import Textarea from 'primevue/textarea'
import PhoneInput from '@/modules/order/components/PhoneInput.vue'
import OrderTimeSelect from '@/modules/order/components/OrderTimeSelect.vue'
import OrderPickRow from '@/modules/order/components/OrderPickRow.vue'
import { captionClass, sectionClass } from '@/modules/order/utils/formLayout'
import Dialog from 'primevue/dialog'
import { useBranchOpening } from '@/modules/branch/composables/useBranchOpening'
import { addDays } from '@/modules/branch/utils/workWindow'
import { formatClock, sameDay } from '@/modules/branch/utils/zonedTime'
import { intlLocale } from '@/i18n'
import { formatAddress } from '@/modules/shared/utils/address'
import type { DeliveryAddress } from '@/modules/fulfillment/utils/deliveryAddress'
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
const phoneInputClass = computed(() =>
  [
    'w-full lg:max-w-sm rounded-xl! border! bg-gray-50! px-3.5! py-3! text-base! text-gray-900!',
    phoneError.value
      ? 'border-red-500! hover:border-red-500! focus:border-red-500!'
      : 'border-gray-100! hover:border-primary! focus:border-primary!',
  ].join(' '),
)
const compositionOpen = ref(false)

type PickupKind = Extract<OrderFormValues['fulfillment_type'], 'pickup' | 'dine_in'>

const pickupKind = computed<PickupKind>(() => {
  const choice = fulfillmentStore.current
  if (
    choice?.type === 'pickup' &&
    choice.pickupKind &&
    fulfillmentStore.methods.includes(choice.pickupKind)
  )
    return choice.pickupKind
  return fulfillmentStore.methods.includes('pickup') ? 'pickup' : 'dine_in'
})

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

const isDelivery = computed(
  () =>
    fulfillmentStore.current?.type === 'delivery' ||
    (!fulfillmentStore.current && fulfillmentStore.availableModes[0] === 'delivery'),
)
const canUseOperator = computed(() => isDelivery.value && branchStore.operatorAddress)
const authenticatedPhone = computed(() => {
  const phone = authStore.client?.phone
  return authStore.isAuthenticated && phone && /^\+7\d{10}$/.test(phone) ? phone : null
})

const delivery = useDeliveryQuote()

const deliveryBlocked = computed(
  () => isDelivery.value && !form.call_operator_for_address && delivery.blocked.value,
)

watch(
  () => fulfillmentStore.addressByOperator,
  (value) => {
    form.call_operator_for_address = value
  },
  { immediate: true, flush: 'sync' },
)
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

watch(
  () => fulfillmentStore.current,
  (choice) => {
    if (choice) cartStore.setFulfillment(fulfillmentType.value).catch(console.error)
  },
  { immediate: true },
)
watch(
  () => [branchStore.activeBranch?.id, fulfillmentStore.current] as const,
  ([branchId, choice]) => {
    if (
      branchId &&
      !choice &&
      fulfillmentStore.canOrder &&
      !flowStore.isPickerOpen &&
      !flowStore.isPromptOpen
    ) {
      flowStore.openPicker(fulfillmentStore.availableModes[0] ?? 'delivery')
    }
  },
  { immediate: true },
)
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

const commentOpen = ref(false)
const commentDraft = ref('')

function editComment() {
  commentDraft.value = form.comment
  commentOpen.value = true
}

function saveComment() {
  form.comment = commentDraft.value.trim()
  commentOpen.value = false
}

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
        const choice = fulfillmentStore.current
        if (
          choice?.type === 'pickup' &&
          !choice.pickupKind &&
          (saved.pickupKind === 'pickup' || saved.pickupKind === 'dine_in') &&
          fulfillmentStore.methods.includes(saved.pickupKind)
        ) {
          fulfillmentStore.choose(branchId, { ...choice, pickupKind: saved.pickupKind })
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

const fulfillmentOptions = computed(() =>
  (['delivery', 'pickup', 'dine_in'] as const)
    .filter((method) => fulfillmentStore.methods.includes(method))
    .map((method) => ({
      value: method,
      label: t(
        method === 'delivery'
          ? 'order.form.delivery'
          : method === 'pickup'
            ? 'order.form.pickup'
            : 'order.form.dineIn',
      ),
    })),
)

function selectFulfillment(method: OrderFormValues['fulfillment_type']) {
  if (method === 'delivery') {
    if (!isDelivery.value || !fulfillmentStore.current) flowStore.openPicker('delivery')
    return
  }
  const branchId = branchStore.activeBranch?.id
  if (
    branchId &&
    fulfillmentStore.methods.includes(method) &&
    (!fulfillmentStore.current || fulfillmentType.value !== method)
  )
    fulfillmentStore.choose(branchId, { type: 'pickup', pickupKind: method })
}

function openAddressPicker() {
  flowStore.openPicker(fulfillmentStore.current?.type ?? 'delivery')
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
    flowStore.openPicker(fulfillmentStore.availableModes[0] ?? 'delivery')
    return
  }

  if (deliveryBlocked.value) return

  const callOperator = canUseOperator.value && form.call_operator_for_address
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
  <form class="flex flex-col gap-5 lg:gap-6" novalidate @submit.prevent="handleSubmit">
    <h2 class="text-xl font-bold text-gray-950">{{ headline }}</h2>

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

    <div :class="sectionClass">
      <p :class="[captionClass, 'sr-only lg:not-sr-only']">{{ addressCaption }}</p>
      <div
        class="flex flex-col gap-1.5 rounded-2xl bg-gray-100 p-1.5"
      >
        <div
          class="flex rounded-xl bg-gray-200 p-1"
          role="group"
          :aria-label="addressCaption"
        >
          <button
            v-for="option in fulfillmentOptions"
            :key="option.value"
            type="button"
            class="relative min-w-0 flex-1 cursor-pointer rounded-xl px-1 py-2 text-center text-[13px] font-medium leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            :class="
              fulfillmentType === option.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-700 hover:bg-white/50'
            "
            :aria-pressed="fulfillmentType === option.value"
            @click="selectFulfillment(option.value)"
          >
            <span
              v-if="option.value === 'dine_in' && fulfillmentStore.methods.includes('pickup')"
              aria-hidden="true"
              class="pointer-events-none absolute start-0 top-1/2 h-5 w-px -translate-y-1/2 bg-gray-400/65"
            />
            {{ option.label }}
          </button>
        </div>
        <button
          type="button"
          class="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-150 hover:bg-gray-200 focus-visible:bg-gray-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          :aria-label="`${addressCaption}: ${addressRow.text || addressRow.title}`"
          @click="openAddressPicker"
        >
          <span
            class="h-8 w-8 shrink-0 bg-current text-gray-900"
            :style="{
              mask: `url(${isDelivery ? courierIcon : restaurantIcon}) center / contain no-repeat`,
              maskMode: 'alpha',
            }"
            aria-hidden="true"
          />
          <span
            class="min-w-0 flex-1 text-sm font-medium leading-snug text-gray-900 sm:text-[15px]"
            >{{ addressRow.text || addressRow.title }}</span
          >
          <svg
            class="h-7 w-7 shrink-0 text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m9 5 7 7-7 7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

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
        v-if="
          isDelivery &&
          delivery.hint.value &&
          delivery.price.value !== 0 &&
          !form.call_operator_for_address
        "
        class="mt-2 text-sm font-medium"
        :class="delivery.blocked.value ? 'text-red-500' : 'text-gray-700'"
      >
        {{ delivery.hint.value }}
      </p>
    </div>

    <OrderTimeSelect v-model="form.cook_by" :fulfillment="fulfillmentType" />

    <div :class="sectionClass">
      <p :class="captionClass">{{ t('order.form.paymentCaption') }}</p>
      <OrderPickRow
        :title="paymentLabel"
        :icon="form.payment_method === 'cash' ? 'pi-money-bill' : 'pi-credit-card'"
        :text="t('order.form.changePayment')"
        aria-haspopup="dialog"
        @click="paymentOpen = true"
      />
    </div>

    <div :class="sectionClass">
      <p :class="captionClass">{{ t('order.form.comment') }}</p>
      <OrderPickRow
        icon="pi-comment"
        :title="form.comment || t('order.form.addComment')"
        :text="form.comment ? undefined : t('order.form.commentPlaceholder')"
        class="[overflow-wrap:anywhere]"
        aria-haspopup="dialog"
        @click="editComment"
      />
    </div>

    <Dialog
      v-model:visible="commentOpen"
      :header="t('order.form.comment')"
      modal
      dismissable-mask
      :draggable="false"
      class="w-[min(92vw,420px)]"
    >
      <Textarea
        v-model="commentDraft"
        autofocus
        rows="3"
        :aria-label="t('order.form.comment')"
        :placeholder="t('order.form.commentPlaceholder')"
        class="w-full rounded-xl! bg-gray-50! text-base! text-gray-900!"
      />
      <template #footer>
        <Button type="button" :label="t('common.save')" rounded @click="saveComment" />
      </template>
    </Dialog>

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
        class="mb-2 flex w-full items-center justify-between rounded-xl bg-gray-100 px-3.5 py-2.5 text-left text-sm font-semibold"
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
        <button
          v-if="deliveryFee !== null"
          type="button"
          class="flex w-full cursor-pointer justify-between text-left"
          @click="openAddressPicker"
        >
          <span>{{ t('delivery.line') }}</span>
          <span class="tabular-nums">
            {{ deliveryFee ? formatPrice(deliveryFee) : t('common.free') }}
          </span>
        </button>
        <div class="flex justify-between text-base font-bold text-gray-950">
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
          class="h-12 rounded-full! text-sm font-semibold"
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
        class="min-w-0 flex-1 h-12 rounded-full! text-sm font-semibold"
      />
    </div>

    <LoyaltyEarnings :spend-points="starsToSpend" />
    <OrderConsent />
  </form>
</template>
