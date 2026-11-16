<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ResponsiveSheet from '@/modules/shared/components/ui/ResponsiveSheet.vue'
import { captionClass, sectionClass } from '../utils/formLayout'
import type { useOrderTime, Fulfillment } from '../composables/useOrderTime'
import { useI18n } from 'vue-i18n'
import clockIcon from '@/assets/icons/fulfillment/clock.png'

const props = defineProps<{
  fulfillment: Fulfillment
  orderTime: ReturnType<typeof useOrderTime>
}>()
const modelValue = defineModel<string | null>({ required: true })
const { t } = useI18n()

const { days, asapAvailable, asapLabel, isAvailable, fallback, selectedLabel: scheduledLabel } =
  props.orderTime

const isDialogOpen = ref(false)
const draftMode = ref<'asap' | 'chosen'>('asap')
const draftDay = ref<string | null>(null)
const draftTime = ref('')
const draftTouched = ref(false)

const visibleDay = computed(
  () => days.value.find((day) => day.key === draftDay.value && day.ranges.length) ??
    days.value.find((day) => day.ranges.length) ?? null,
)

const selectedLabel = computed(() => {
  if (modelValue.value === null)
    return `${t('order.timeSelect.asap')} ${asapLabel.value}`
  return isAvailable(modelValue.value)
    ? scheduledLabel(modelValue.value)
    : t('order.timeSelect.pick')
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
  [() => modelValue.value, days, asapAvailable],
  () => {
    if (modelValue.value === null && !asapAvailable.value) modelValue.value = fallback()
  },
  { immediate: true },
)

function dayOf(value: string | null) {
  return value?.slice(0, 10) ?? null
}

function timeOf(value: string | null) {
  return value?.slice(11, 16) ?? ''
}

function firstSuggestedTime(day: typeof visibleDay.value) {
  return day?.suggestions[0] ?? day?.ranges[0]?.start ?? ''
}

function selectDay(key: string) {
  draftDay.value = key
  draftTime.value = firstSuggestedTime(visibleDay.value)
  draftTouched.value = false
}

function setMode(mode: 'asap' | 'chosen') {
  if (mode === 'asap' && !asapAvailable.value) return
  draftMode.value = mode
  if (mode === 'chosen' && !draftTime.value) draftTime.value = firstSuggestedTime(visibleDay.value)
}

function openDialog() {
  const value = isAvailable(modelValue.value) ? modelValue.value : fallback()
  const day = days.value.find((item) => item.key === dayOf(value) && item.ranges.length) ??
    days.value.find((item) => item.ranges.length)
  draftDay.value = day?.key ?? null
  draftTime.value = value && dayOf(value) === day?.key ? timeOf(value) : firstSuggestedTime(day ?? null)
  draftMode.value = value === null && asapAvailable.value ? 'asap' : 'chosen'
  draftTouched.value = false
  isDialogOpen.value = true
}

watch([days, asapAvailable], () => {
  if (!isDialogOpen.value) return
  if (!days.value.some((day) => day.key === draftDay.value && day.ranges.length)) {
    draftDay.value = days.value.find((day) => day.ranges.length)?.key ?? null
    draftTime.value = firstSuggestedTime(visibleDay.value)
    draftTouched.value = false
  }
  if (draftMode.value === 'asap' && !asapAvailable.value) {
    draftMode.value = 'chosen'
    draftTime.value = firstSuggestedTime(visibleDay.value)
    draftTouched.value = false
  }
  if (draftMode.value === 'chosen' && !draftTouched.value && !isDraftTimeAvailable.value)
    draftTime.value = firstSuggestedTime(visibleDay.value)
})

function minutes(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

const matchingRange = computed(() => {
  const minute = minutes(draftTime.value)
  return minute === null ? null : (visibleDay.value?.ranges.find((range) => {
    const start = minutes(range.start)
    const end = minutes(range.end)
    return start !== null && end !== null && minute >= start && minute <= end
  }) ?? null)
})

const draftValue = computed(() =>
  draftMode.value === 'asap' ? null : `${draftDay.value}T${draftTime.value}:00`,
)
const isDraftTimeAvailable = computed(() =>
  !!draftDay.value && !!matchingRange.value && isAvailable(`${draftDay.value}T${draftTime.value}:00`),
)
const canConfirm = computed(() => draftMode.value === 'asap'
  ? asapAvailable.value
  : isDraftTimeAvailable.value)

const rangeHint = computed(() => {
  const day = visibleDay.value
  if (!day) return t('order.timeSelect.noSlots')
  const minute = minutes(draftTime.value)
  if (minute === null) return t('order.timeSelect.invalidFormat')
  if (isDraftTimeAvailable.value && matchingRange.value)
    return t('order.timeSelect.availableRange', {
      start: matchingRange.value.start,
      end: matchingRange.value.end,
    })
  const first = day.ranges[0]
  const last = day.ranges.at(-1)
  if (first && minute < (minutes(first.start) ?? 0))
    return t('order.timeSelect.tooEarly', { time: first.start })
  if (last && minute > (minutes(last.end) ?? 0))
    return t('order.timeSelect.tooLate', { time: last.end })
  return t('order.timeSelect.unavailableTime')
})

function onTimeInput(event: Event) {
  const input = event.target as HTMLInputElement
  const raw = input.value.replace(/[^\d:]/g, '').slice(0, 5)
  const digits = raw.replace(/:/g, '').slice(0, 4)
  draftTime.value = !raw.includes(':') && digits.length > 2
    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
    : raw
  input.value = draftTime.value
  draftTouched.value = true
}

function confirm() {
  if (!canConfirm.value) return
  modelValue.value = draftValue.value
  isDialogOpen.value = false
}
</script>

<template>
  <div :class="sectionClass">
    <p :class="captionClass">{{ caption }}</p>

    <button
      v-if="asapAvailable || days.some((day) => day.ranges.length)"
      type="button"
      class="flex w-full cursor-pointer items-center gap-2.5 rounded-2xl bg-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-200/70 focus-visible:outline-2 focus-visible:outline-primary"
      :aria-label="`${caption}: ${selectedLabel}. ${changeLabel}`"
      @click="openDialog"
    >
      <span
        class="h-8 w-8 shrink-0 bg-current text-gray-900"
        :style="{ mask: `url(${clockIcon}) center / 21px 21px no-repeat`, maskMode: 'alpha' }"
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

    <ResponsiveSheet
      v-model:visible="isDialogOpen"
      :aria-label="t(fulfillment === 'delivery' ? 'order.timeSelect.dialogDelivery' : 'order.timeSelect.dialogPickup')"
      desktop-class="w-[min(92vw,440px)]"
    >
      <template #header>
        <h3 id="order-time-dialog-title" class="text-xl font-extrabold text-gray-950">
          {{ t(fulfillment === 'delivery' ? 'order.timeSelect.dialogDelivery' : 'order.timeSelect.dialogPickup') }}
        </h3>
      </template>

      <div class="flex gap-1 rounded-xl bg-gray-200 p-1" role="group" :aria-label="t('order.timeSelect.modeLabel')">
        <button
          type="button"
          class="min-h-11 flex-1 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40"
          :class="draftMode === 'asap' ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-700 hover:bg-white/50'"
          :aria-pressed="draftMode === 'asap'"
          :disabled="!asapAvailable"
          @click="setMode('asap')"
        >
          {{ t('order.timeSelect.asap') }}
        </button>
        <button
          type="button"
          class="min-h-11 flex-1 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          :class="draftMode === 'chosen' ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-700 hover:bg-white/50'"
          :aria-pressed="draftMode === 'chosen'"
          @click="setMode('chosen')"
        >
          {{ t('order.timeSelect.title') }}
        </button>
      </div>

      <div v-if="draftMode === 'chosen' && visibleDay">
        <div class="my-4 flex flex-wrap gap-1.5" role="group" :aria-label="t('order.timeSelect.dayLabel')">
          <button
            v-for="day in days"
            :key="day.key"
            type="button"
            class="min-h-10 rounded-xl border-2 px-2.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40"
            :class="visibleDay.key === day.key ? 'border-primary-fill bg-white text-gray-950' : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-primary'"
            :aria-pressed="visibleDay.key === day.key"
            :disabled="!day.ranges.length"
            @click="selectDay(day.key)"
          >
            {{ day.label }}
          </button>
        </div>

        <label for="order-time-input" class="block rounded-2xl bg-gray-100 px-5 py-4 focus-within:outline-2 focus-within:outline-primary">
          <span class="block text-sm text-gray-500">{{ fulfillment === 'delivery' ? t('order.timeSelect.titleDelivery') : t('order.timeSelect.timeField') }}</span>
          <input
            id="order-time-input"
            :value="draftTime"
            type="text"
            inputmode="numeric"
            maxlength="5"
            autocomplete="off"
            class="mt-1 w-full bg-transparent text-[42px] font-semibold leading-tight tabular-nums tracking-tight text-gray-900 outline-none"
            :aria-invalid="!isDraftTimeAvailable"
            aria-describedby="order-time-range"
            @input="onTimeInput"
            @keydown.enter.prevent="confirm"
          />
        </label>
        <p id="order-time-range" class="mt-2 text-sm" :class="isDraftTimeAvailable ? 'text-gray-500' : 'text-red-600'" role="status">
          {{ rangeHint }}
        </p>
        <div v-if="visibleDay.suggestions.length" class="mt-3 flex flex-wrap gap-2" role="group" :aria-label="t('order.timeSelect.quickTimes')">
          <button
            v-for="time in visibleDay.suggestions"
            :key="time"
            type="button"
            class="min-h-10 rounded-xl bg-gray-100 px-3 text-sm font-medium tabular-nums text-gray-900 transition-colors hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-primary"
            @click="draftTime = time; draftTouched = true"
          >
            {{ time }}
          </button>
        </div>
      </div>
      <div v-else-if="draftMode === 'asap'" class="mt-4 rounded-2xl bg-gray-100 px-5 py-4">
        <span class="block text-sm text-gray-500">{{ t('order.timeSelect.asapEstimate') }}</span>
        <strong class="block text-[42px] leading-tight tabular-nums tracking-tight text-gray-900">{{ asapLabel }}</strong>
      </div>
      <p v-else class="mt-4 text-sm text-gray-500">{{ t('order.timeSelect.noSlots') }}</p>

      <button
        type="button"
        class="mt-5 min-h-12 w-full rounded-xl bg-primary-fill px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40"
        :disabled="!canConfirm"
        @click="confirm"
      >
        {{ draftMode === 'asap'
          ? t('order.timeSelect.confirmAsap')
          : t(fulfillment === 'delivery' ? 'order.timeSelect.confirmDelivery' : 'order.timeSelect.confirmPickup', { time: draftTime }) }}
      </button>
    </ResponsiveSheet>
  </div>
</template>
