<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import Dialog from 'primevue/dialog'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'
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
  activeDay.value = days.value[0]?.key ?? null
  isDialogOpen.value = true
}

function pick(value: string) {
  modelValue.value = value
  isDialogOpen.value = false
}

function optionClass(active: boolean) {
  return active
    ? 'bg-primary text-white border-primary shadow-sm'
    : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
}
</script>

<template>
  <SurfaceCard icon="pi-clock" :title="t('order.timeSelect.title')">
    <div v-if="days.length" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <button
        v-if="asapAvailable"
        type="button"
        class="rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors cursor-pointer flex flex-col items-center leading-tight"
        :class="optionClass(modelValue === null)"
        @click="modelValue = null"
      >
        <span>{{ t('order.timeSelect.asap') }}</span>
        <span class="text-xs font-medium opacity-75">{{ asapLabel }}</span>
      </button>
      <button
        v-for="slot in suggestions"
        :key="slot.value"
        type="button"
        class="rounded-2xl border px-3 py-3 text-sm font-semibold tabular-nums transition-colors cursor-pointer"
        :class="optionClass(modelValue === slot.value)"
        @click="modelValue = slot.value"
      >
        {{ slotLabel(slot) }}
      </button>
      <button
        type="button"
        class="rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors cursor-pointer"
        :class="optionClass(customSelected)"
        @click="openDialog"
      >
        <i class="pi pi-calendar mr-1 text-xs" />
        {{ customLabel }}
      </button>
    </div>
    <p v-else class="text-sm text-gray-500">{{ t('order.timeSelect.noSlots') }}</p>

    <p v-if="days.length" class="mt-3 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
      <span v-if="workingUntil">
        <i class="pi pi-building mr-1 text-[10px]" />{{
          t('order.timeSelect.openUntil', { time: workingUntil })
        }}
      </span>
      <span v-else class="text-amber-600">
        <i class="pi pi-moon mr-1 text-[10px]" />{{ t('order.timeSelect.closedNow') }}
      </span>
      <span><i class="pi pi-stopwatch mr-1 text-[10px]" />{{ leadHint }}</span>
    </p>

    <Dialog
      v-model:visible="isDialogOpen"
      modal
      :dismissableMask="true"
      :draggable="false"
      class="w-[min(92vw,440px)]"
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
          class="shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer"
          :class="optionClass(visibleDay?.key === day.key)"
          @click="activeDay = day.key"
        >
          {{ day.label }}
        </button>
      </div>

      <div
        v-if="visibleDay"
        class="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[50vh] overflow-y-auto"
      >
        <button
          v-for="slot in visibleDay.slots"
          :key="slot.value"
          type="button"
          class="rounded-2xl border px-2 py-2.5 text-sm font-semibold tabular-nums transition-colors cursor-pointer"
          :class="optionClass(modelValue === slot.value)"
          @click="pick(slot.value)"
        >
          {{ formatTimeLabel(slot.date) }}
        </button>
      </div>
      <p v-else class="text-sm text-gray-500">{{ t('order.timeSelect.noSlots') }}</p>
    </Dialog>
  </SurfaceCard>
</template>
