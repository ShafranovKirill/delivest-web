<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { captionClass, sectionClass } from '../utils/formLayout'
import { useOrderTime, type Fulfillment } from '../composables/useOrderTime'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ fulfillment: Fulfillment }>()
const modelValue = defineModel<string | null>({ required: true })
const { t } = useI18n()

const {
  days,
  suggestions,
  asapAvailable,
  asapLabel,
  workingUntil,
  leadMinutes,
  slotLabel,
  formatTimeLabel,
  isAvailable,
  fallback,
} = useOrderTime(toRef(props, 'fulfillment'))

const isDialogOpen = ref(false)
const activeDay = ref<string | null>(null)

const visibleDay = computed(
  () => days.value.find((day) => day.key === activeDay.value) ?? days.value[0] ?? null,
)

const customSelected = computed(
  () =>
    modelValue.value !== null && !suggestions.value.some((slot) => slot.value === modelValue.value),
)

const customLabel = computed(() => {
  if (!customSelected.value) return t('order.timeSelect.custom')
  const slot = days.value
    .flatMap((day) => day.slots)
    .find((item) => item.value === modelValue.value)
  return slot ? slotLabel(slot) : t('order.timeSelect.custom')
})

const caption = computed(() =>
  props.fulfillment === 'delivery'
    ? t('order.timeSelect.titleDelivery')
    : t('order.timeSelect.titlePickup'),
)

const leadHint = computed(() =>
  props.fulfillment === 'delivery'
    ? t('order.timeSelect.deliveryLead', { minutes: leadMinutes.value })
    : t('order.timeSelect.pickupLead', { minutes: leadMinutes.value }),
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

function pick(value: string) {
  modelValue.value = value
  isDialogOpen.value = false
}

function chipClass(active: boolean) {
  return active
    ? 'bg-white text-gray-950 border-primary-fill'
    : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
}
</script>

<template>
  <div :class="sectionClass">
    <p :class="captionClass">{{ caption }}</p>

    <div
      v-if="days.length"
      class="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0"
    >
      <button
        v-if="asapAvailable"
        type="button"
        class="flex shrink-0 snap-start flex-col items-center rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold leading-tight transition-colors cursor-pointer"
        :class="chipClass(modelValue === null)"
        @click="modelValue = null"
      >
        <span>{{ t('order.timeSelect.asap') }}</span>
        <span class="text-xs font-medium opacity-75">{{ asapLabel }}</span>
      </button>
      <button
        v-for="slot in suggestions"
        :key="slot.value"
        type="button"
        class="shrink-0 snap-start rounded-2xl border-2 px-4 py-3 text-sm font-semibold tabular-nums transition-colors cursor-pointer"
        :class="chipClass(modelValue === slot.value)"
        @click="modelValue = slot.value"
      >
        {{ slotLabel(slot) }}
      </button>
      <button
        type="button"
        class="shrink-0 snap-start whitespace-nowrap rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer"
        :class="chipClass(customSelected)"
        @click="openDialog"
      >
        {{ customLabel }}
      </button>
    </div>
    <p v-else class="text-sm text-gray-500">{{ t('order.timeSelect.noSlots') }}</p>

    <p v-if="days.length" class="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
      <span v-if="workingUntil">{{ t('order.timeSelect.openUntil', { time: workingUntil }) }}</span>
      <span>{{ leadHint }}</span>
    </p>

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
          class="flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-sm font-semibold tabular-nums transition-colors cursor-pointer"
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
