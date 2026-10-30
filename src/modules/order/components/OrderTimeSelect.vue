<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import Dialog from 'primevue/dialog'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'
import { useOrderTime, type Fulfillment, type TimeSlot } from '../composables/useOrderTime'
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

const activeHour = ref<number | null>(null)
const pending = ref<string | null>(null)

function pad(value: number) {
  return String(value).padStart(2, '0')
}

const hours = computed(() => {
  const groups: { hour: number; slots: TimeSlot[] }[] = []
  for (const slot of visibleDay.value?.slots ?? []) {
    const hour = slot.date.getHours()
    const group = groups.find((item) => item.hour === hour)
    if (group) group.slots.push(slot)
    else groups.push({ hour, slots: [slot] })
  }
  return groups
})

const visibleHour = computed(
  () => hours.value.find((group) => group.hour === activeHour.value) ?? hours.value[0] ?? null,
)

const pendingLabel = computed(() => {
  const slot = visibleDay.value?.slots.find((item) => item.value === pending.value)
  return slot ? formatTimeLabel(slot.date) : null
})

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
  const selected = days.value.find((day) =>
    day.slots.some((slot) => slot.value === modelValue.value),
  )
  activeDay.value = (selected ?? days.value[0])?.key ?? null
  pending.value = selected ? modelValue.value : null
  activeHour.value = selected
    ? (selected.slots.find((slot) => slot.value === modelValue.value)?.date.getHours() ?? null)
    : null
  isDialogOpen.value = true
}

function selectDay(key: string) {
  activeDay.value = key
  activeHour.value = null
  pending.value = null
}

function pick(value: string) {
  modelValue.value = value
  isDialogOpen.value = false
}

function optionClass(active: boolean) {
  return active
    ? 'bg-primary-fill text-white border-primary-fill shadow-sm'
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
          @click="selectDay(day.key)"
        >
          {{ day.label }}
        </button>
      </div>

      <template v-if="visibleDay">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {{ t('order.timeSelect.hour') }}
        </p>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="group in hours"
            :key="group.hour"
            type="button"
            class="rounded-2xl border py-2.5 text-sm font-bold tabular-nums transition-colors cursor-pointer"
            :class="optionClass(visibleHour?.hour === group.hour)"
            @click="activeHour = group.hour"
          >
            {{ pad(group.hour) }}
          </button>
        </div>

        <p class="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {{ t('order.timeSelect.minutes') }}
        </p>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="slot in visibleHour?.slots ?? []"
            :key="slot.value"
            type="button"
            class="rounded-2xl border py-2.5 text-sm font-bold tabular-nums transition-colors cursor-pointer"
            :class="optionClass(pending === slot.value)"
            @click="pending = slot.value"
          >
            :{{ pad(slot.date.getMinutes()) }}
          </button>
        </div>

        <button
          type="button"
          :disabled="!pending"
          class="mt-6 h-12 w-full rounded-full bg-primary-fill font-semibold text-white transition-opacity disabled:opacity-40 cursor-pointer disabled:cursor-default"
          @click="pending && pick(pending)"
        >
          {{
            pendingLabel
              ? t('order.timeSelect.confirm', { time: pendingLabel })
              : t('order.timeSelect.choose')
          }}
        </button>
      </template>
      <p v-else class="text-sm text-gray-500">{{ t('order.timeSelect.noSlots') }}</p>
    </Dialog>
  </SurfaceCard>
</template>
