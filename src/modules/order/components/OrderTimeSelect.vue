<script setup lang="ts">
import Dialog from 'primevue/dialog'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'
import { useOrderTime } from '../composables/useOrderTime'

const modelValue = defineModel<string | null>({ required: true })

const {
  isCustomTimeDialogOpen,
  selectedPreset,
  selectedCustomTimes,
  presetOptions,
  customTimeOptions,
  formatTimeLabel,
} = useOrderTime(modelValue)

function selectPreset(preset: string, value: string | null) {
  selectedPreset.value = preset

  if (preset === 'custom') {
    isCustomTimeDialogOpen.value = true
    return
  }

  modelValue.value = value
}

function selectCustomTime(slot: string) {
  modelValue.value = slot
  selectedPreset.value = slot

  if (!selectedCustomTimes.value.includes(slot)) {
    selectedCustomTimes.value.push(slot)
  }

  isCustomTimeDialogOpen.value = false
}
</script>

<template>
  <SurfaceCard icon="pi-clock" title="Когда приготовить">
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <button
        v-for="option in presetOptions"
        :key="option.id"
        type="button"
        class="rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors cursor-pointer"
        :class="
          option.active
            ? 'bg-primary text-white border-primary shadow-sm'
            : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
        "
        @click="selectPreset(option.id, option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <Dialog
      v-model:visible="isCustomTimeDialogOpen"
      modal
      :dismissableMask="true"
      :draggable="false"
      class="w-[min(92vw,420px)]"
      :pt="{ root: { class: 'rounded-4xl! overflow-hidden' } }"
    >
      <template #header>
        <h3 class="text-xl font-extrabold text-gray-950">Выберите время</h3>
      </template>

      <div v-if="customTimeOptions.length" class="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <button
          v-for="slot in customTimeOptions"
          :key="slot"
          type="button"
          class="rounded-2xl border px-2 py-2.5 text-sm font-semibold tabular-nums transition-colors cursor-pointer"
          :class="
            modelValue === slot
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
          "
          @click="selectCustomTime(slot)"
        >
          {{ formatTimeLabel(new Date(slot)) }}
        </button>
      </div>
      <p v-else class="text-sm text-gray-500">Сегодня рабочее время закончилось.</p>
    </Dialog>
  </SurfaceCard>
</template>
