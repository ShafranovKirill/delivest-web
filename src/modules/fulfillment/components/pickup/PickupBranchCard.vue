<script setup lang="ts">
import { computed, toRef } from 'vue'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import type { Branch } from '@/modules/branch/api/branch.service'
import { useBranchSchedule } from '@/modules/branch/composables/useBranchSchedule'
import { formatPhoneNumber } from '@/modules/widgets/contacts/utils/tel-format'

const props = defineProps<{
  branch: Branch
  loading: boolean
  pickupKind: 'pickup' | 'dine_in'
}>()
defineEmits<{ confirm: [] }>()

const { t } = useI18n()
const { workingHours, closingTimeToday, formattedScheduleList } = useBranchSchedule(
  toRef(props, 'branch'),
)
const phone = computed(() => props.branch.branch_info?.phone_number ?? null)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-xl font-bold text-gray-950">{{ branch.name }}</h2>
      <p v-if="branch.branch_info?.address" class="mt-1 text-sm text-gray-500">
        {{ branch.branch_info.address }}
      </p>
    </div>

    <div class="space-y-2 text-sm text-gray-700">
      <p v-if="workingHours">{{ t('branch.info.today', { time: closingTimeToday }) }}</p>
      <details v-if="workingHours && formattedScheduleList.length" class="group">
        <summary class="w-fit cursor-pointer font-semibold text-primary">
          {{ t('branch.info.week') }}
        </summary>
        <ul class="mt-2 space-y-1">
          <li
            v-for="day in formattedScheduleList"
            :key="day.day"
            class="flex justify-between gap-3"
          >
            <span :class="{ 'font-semibold': day.isToday }">{{ day.day }}</span>
            <span class="tabular-nums">{{
              day.enabled ? `${day.open} — ${day.close}` : t('branch.schedule.dayOff')
            }}</span>
          </li>
        </ul>
      </details>
      <a v-if="phone" :href="`tel:${phone}`" class="inline-flex items-center gap-2 text-primary">
        <i class="pi pi-phone" aria-hidden="true" />{{ formatPhoneNumber(phone) }}
      </a>
    </div>

    <Button
      :label="pickupKind === 'pickup' ? t('fulfillment.pickupHere') : t('fulfillment.dineInHere')"
      :loading="loading"
      class="h-12 w-full rounded-full! font-semibold"
      @click="$emit('confirm')"
    />
  </div>
</template>
