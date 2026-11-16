<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { captionClass, sectionClass } from '../utils/formLayout'
import { useOrderTime, type Fulfillment } from '../composables/useOrderTime'
import { useI18n } from 'vue-i18n'
import clockIcon from '@/assets/icons/fulfillment/clock.png'

const props = defineProps<{ fulfillment: Fulfillment }>()
const modelValue = defineModel<string | null>({ required: true })
const { t } = useI18n()

const { days, asapAvailable, asapLabel, slotLabel, formatTimeLabel, isAvailable, fallback } =
  useOrderTime(toRef(props, 'fulfillment'))

const isDialogOpen = ref(false)
const activeDay = ref<string | null>(null)

const visibleDay = computed(
  () => days.value.find((day) => day.key === activeDay.value) ?? days.value[0] ?? null,
)

const selectedLabel = computed(() => {
  if (modelValue.value === null) return `${t('order.timeSelect.asap')} ${asapLabel.value}`
  const slot = days.value
    .flatMap((day) => day.slots)
    .find((item) => item.value === modelValue.value)
  return slot ? slotLabel(slot) : t('order.timeSelect.pick')
})

const changeLabel = computed(() =>
  props.fulfillment === 'delivery'
    ? t('order.timeSelect.changeDelivery')
    : t('order.timeSelect.changePickup'),
)

const caption = computed(() =>
  props.fulfillment === 'delivery'
    ? t('order.timeSelect.titleDelivery')
    : t('order.timeSelect.titlePickup'),
)

watch(
  [() => modelValue.value, days],
  () => {
    if (!isAvailable(modelValue.value)) modelValue.value = fallback()
  },
  { immediate: true },
)

function openDialog() {
  const selected = days.value.find((day) =>
    day.slots.some((slot) => slot.value === modelValue.value),
  )
  activeDay.value = (selected ?? days.value[0])?.key ?? null
  isDialogOpen.value = true
}

function pick(value: string | null) {
  modelValue.value = value
  isDialogOpen.value = false
}

function chipClass(active: boolean) {
  return active
    ? 'bg-white text-gray-950 border-primary-fill'
    : 'bg-gray-50 text-gray-700 border-gray-100 hover:border-primary'
}
</script>

<template>
  <div :class="sectionClass">
    <p :class="captionClass">{{ caption }}</p>

    <button
      v-if="days.length"
      type="button"
      class="flex w-full cursor-pointer items-center gap-2.5 rounded-2xl bg-gray-100 px-3 py-3 text-left transition-colors hover:bg-gray-200/70 focus-visible:outline-2 focus-visible:outline-primary"
      :aria-label="`${caption}: ${selectedLabel}. ${changeLabel}`"
      @click="openDialog"
    >
      <span
        class="h-8 w-8 shrink-0 bg-current text-gray-900"
        :style="{ mask: `url(${clockIcon}) center / 26px 26px no-repeat`, maskMode: 'alpha' }"
        aria-hidden="true"
      />
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-medium leading-snug text-gray-900 sm:text-[15px]">{{
          selectedLabel
        }}</span>
        <span class="block text-xs text-gray-500">{{ changeLabel }}</span>
      </span>
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
    <p v-else class="text-sm text-gray-500">{{ t('order.timeSelect.noSlots') }}</p>

    <Dialog
      v-model:visible="isDialogOpen"
      modal
      :dismissableMask="true"
      :draggable="false"
      class="w-[min(92vw,520px)]"
      :pt="{ root: { class: 'rounded-4xl! overflow-hidden' } }"
    >
      <template #header>
        <h3 class="text-xl font-extrabold text-gray-950">{{ t('order.timeSelect.pick') }}</h3>
      </template>

      <button
        v-if="asapAvailable"
        type="button"
        class="mb-3 flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors"
        :class="chipClass(modelValue === null)"
        @click="pick(null)"
      >
        <span>{{ t('order.timeSelect.asap') }} {{ asapLabel }}</span>
        <i v-if="modelValue === null" class="pi pi-check text-xs" />
      </button>

      <div v-if="days.length > 1" class="mb-4 flex gap-2 overflow-x-auto">
        <button
          v-for="day in days"
          :key="day.key"
          type="button"
          class="shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer"
          :class="chipClass(visibleDay?.key === day.key)"
          @click="activeDay = day.key"
        >
          {{ day.label }}
        </button>
      </div>

      <div
        v-if="visibleDay"
        class="grid max-h-[55vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2"
      >
        <button
          v-for="slot in visibleDay.slots"
          :key="slot.value"
          type="button"
          class="flex items-center justify-between min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold tabular-nums transition-colors cursor-pointer"
          :class="chipClass(modelValue === slot.value)"
          @click="pick(slot.value)"
        >
          <span>{{ formatTimeLabel(slot.date) }}</span>
          <i v-if="modelValue === slot.value" class="pi pi-check text-xs" />
        </button>
      </div>
      <p v-else class="text-sm text-gray-500">{{ t('order.timeSelect.noSlots') }}</p>
    </Dialog>
  </div>
</template>
