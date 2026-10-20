<script setup lang="ts">
import { computed } from 'vue'
import type { ActiveOrder } from '../../api/order.service'
import { currentStep, orderSteps, statusIcon, statusLabel } from '../../utils/orderStatus'

const props = withDefaults(defineProps<{ order: ActiveOrder; detailed?: boolean }>(), {
  detailed: false,
})

const steps = computed(() => orderSteps(props.order))
const current = computed(() => currentStep(props.order))
</script>

<template>
  <div v-if="!detailed" class="flex gap-1">
    <span
      v-for="(step, index) in steps"
      :key="step"
      class="h-1.5 flex-1 rounded-full transition-colors duration-500"
      :class="index <= current ? 'bg-primary' : 'bg-gray-200'"
    />
  </div>

  <ol v-else class="flex flex-col gap-3">
    <li v-for="(step, index) in steps" :key="step" class="flex items-center gap-3">
      <span
        class="grid place-items-center size-10 shrink-0 rounded-2xl transition-colors"
        :class="
          index < current
            ? 'bg-primary-soft text-primary'
            : index === current
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-400'
        "
      >
        <i :class="['pi', index < current ? 'pi-check' : statusIcon(step)]" />
      </span>
      <span
        class="font-semibold"
        :class="
          index === current ? 'text-gray-950' : index < current ? 'text-gray-500' : 'text-gray-400'
        "
      >
        {{ statusLabel(step) }}
      </span>
      <span
        v-if="index === current"
        class="ml-auto size-2.5 rounded-full bg-primary animate-pulse"
        aria-hidden="true"
      />
    </li>
  </ol>
</template>
