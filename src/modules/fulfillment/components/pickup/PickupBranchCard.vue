<script setup lang="ts">
import { toRef } from 'vue'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import type { Branch } from '@/modules/branch/api/branch.service'
import { useBranchSchedule } from '@/modules/branch/composables/useBranchSchedule'

const props = defineProps<{ branch: Branch; loading: boolean }>()
defineEmits<{ confirm: [] }>()

const { t } = useI18n()
const { workingHours, closingTimeToday } = useBranchSchedule(toRef(props, 'branch'))
</script>

<template>
  <div class="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
    <div>
      <p class="font-bold text-gray-900">{{ branch.name }}</p>
      <p v-if="branch.branch_info?.address" class="text-sm text-gray-500">
        {{ branch.branch_info.address }}
      </p>
    </div>

    <p v-if="workingHours" class="text-sm text-gray-700">
      {{ t('branch.info.today', { time: closingTimeToday }) }}
    </p>

    <Button
      :label="t('fulfillment.pickupHere')"
      :loading="loading"
      class="h-12 w-full rounded-full! font-semibold"
      @click="$emit('confirm')"
    />
  </div>
</template>
