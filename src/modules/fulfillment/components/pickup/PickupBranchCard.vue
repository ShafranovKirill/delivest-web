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
const { workingHours, closingTimeToday } = useBranchSchedule(toRef(props, 'branch'))
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
      <a v-if="phone" :href="`tel:${phone}`" class="inline-flex items-center gap-2 text-gray-900">
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
