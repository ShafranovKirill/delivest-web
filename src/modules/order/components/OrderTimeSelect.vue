<script setup lang="ts">
import Dialog from 'primevue/dialog'
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
  <div
    class="bg-card border border-border/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col gap-4"
  >
    <h2 class="text-base sm:text-lg font-semibold">Время приготовления</h2>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <button
        v-for="option in presetOptions"
        :key="option.id"
        type="button"
        class="rounded-xl border px-2 py-2 text-sm font-medium transition-colors"
        :class="
          option.active
            ? 'bg-(--p-primary-500) text-white border-(--p-primary-500)'
            : 'bg-white text-foreground border-border hover:border-(--p-primary-500)'
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
      class="w-[min(90vw,420px)]"
    >
      <template #header>
        <h3 class="text-base font-semibold">Выберите время</h3>
      </template>

      <div v-if="customTimeOptions.length" class="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <button
          v-for="slot in customTimeOptions"
          :key="slot"
          type="button"
          class="rounded-xl border px-2 py-2 text-sm transition-colors"
          :class="
            modelValue === slot
              ? 'bg-(--p-primary-500) text-white border-(--p-primary-500)'
              : 'bg-white text-foreground border-border hover:border-(--p-primary-500)'
          "
          @click="selectCustomTime(slot)"
        >
          {{ formatTimeLabel(new Date(slot)) }}
        </button>
      </div>
      <p v-else class="text-sm text-muted-foreground">Сегодня рабочее время закончилось.</p>
    </Dialog>
  </div>
</template>
