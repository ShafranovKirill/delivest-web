<script setup lang="ts">
import { toRef } from 'vue'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import type { Branch } from '@/modules/branch/api/branch.service'
import { useBranchSchedule } from '@/modules/branch/composables/useBranchSchedule'

const props = defineProps<{ branch: Branch; loading: boolean }>()
defineEmits<{ confirm: [] }>()

const { t } = useI18n()
const { formattedScheduleList } = useBranchSchedule(toRef(props, 'branch'))
</script>

<template>
  <div class="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
    <div>
      <p class="font-bold text-gray-900">{{ branch.name }}</p>
      <p v-if="branch.branch_info?.address" class="text-sm text-gray-500">
        {{ branch.branch_info.address }}
      </p>
    </div>

    <ul v-if="formattedScheduleList.length" class="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
      <li
        v-for="item in formattedScheduleList"
        :key="item.day"
        class="flex justify-between gap-2"
        :class="item.isToday ? 'font-semibold text-gray-900' : 'text-gray-500'"
      >
        <span>{{ item.day }}</span>
        <span>{{ item.enabled ? `${item.open}–${item.close}` : t('branch.schedule.dayOff') }}</span>
      </li>
    </ul>

    <Button
      :label="t('fulfillment.pickupHere')"
      :loading="loading"
      class="h-12 w-full rounded-full! font-semibold"
      @click="$emit('confirm')"
    />
  </div>
</template>
