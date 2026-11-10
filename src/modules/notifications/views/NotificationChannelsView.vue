<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import AuthRequired from '@/modules/auth/components/AuthRequired.vue'
import { queryClient } from '@/api/client'
import { useLoyaltyPush } from '@/modules/pwa/composables/useLoyaltyPush'
import { useBranchNavigation } from '@/modules/branch/composables/useBranchNavigation'
import { NotificationsService } from '../api/notifications.service'
import { CONSENTS_KEY, useNotificationConsents } from '../composables/useNotifications'

const { t } = useI18n()
const state = useNotificationConsents()
const push = useLoyaltyPush(false)
const navigate = useBranchNavigation()
const saving = ref(false)
const error = ref(false)
const consent = computed(() => state.data.value?.data)

async function setPush(enabled: boolean) {
  if (saving.value) return
  const identity = state.identity.value
  const epoch = state.epoch.value
  const branchId = state.branchId.value
  const current = () => state.identity.value === identity && state.epoch.value === epoch && state.branchId.value === branchId && state.enabled.value
  saving.value = true
  error.value = false
  try {
    if (enabled) {
      await push.enable()
      if (!current() || push.permission.value !== 'granted' || push.failed.value) return
    }
    if (!current()) return
    await NotificationsService.updateConsents(branchId, { push: enabled })
    if (!current()) return
    await queryClient.invalidateQueries({ queryKey: [CONSENTS_KEY] })
  } catch {
    error.value = true
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PageShell :title="t('notifications.channels')" width="narrow">
    <AuthRequired :text="t('notifications.signIn')">
      <div v-if="state.enabled.value" class="space-y-4">
        <p v-if="error" role="alert" class="text-sm text-red-700">{{ t('common.error') }}</p>
        <div class="rounded-3xl border border-gray-200 p-5">
          <h2 class="font-bold text-gray-950">{{ t('notifications.orderUpdates') }}</h2>
          <p class="mt-1 text-sm text-gray-600">{{ t('notifications.orderUpdatesHint') }}</p>
          <div class="mt-3 flex gap-4 text-sm font-semibold text-primary">
            <button type="button" @click="navigate('my-orders')">{{ t('notifications.ordersSettings') }}</button>
            <button type="button" @click="navigate('my-stars')">{{ t('notifications.rewardsSettings') }}</button>
          </div>
        </div>
        <h2 class="pt-3 text-lg font-bold text-gray-950">{{ t('notifications.marketingOffers') }}</h2>
        <div class="rounded-3xl bg-gray-50 p-5">
          <h2 class="font-bold text-gray-950">{{ t('notifications.inApp') }}</h2>
          <p class="mt-1 text-sm text-gray-600">{{ t('notifications.inAppHint') }}</p>
          <p class="mt-2 text-sm font-semibold text-green-700">{{ t('notifications.on') }}</p>
        </div>
        <div class="rounded-3xl bg-gray-50 p-5">
          <h2 class="font-bold text-gray-950">{{ t('notifications.push') }}</h2>
          <p class="mt-1 text-sm text-gray-600">{{ t('notifications.pushHint') }}</p>
          <p v-if="!push.supported" class="mt-2 text-sm text-gray-600">{{ t('notifications.unsupported') }}</p>
          <p v-else-if="push.permission.value === 'denied'" class="mt-2 text-sm text-amber-700">{{ t('notifications.denied') }}</p>
          <button v-if="consent?.push || (push.supported && push.permission.value !== 'denied')" type="button" class="mt-3 rounded-xl bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50" :disabled="saving || state.isLoading.value || push.pending.value" @click="setPush(!consent?.push)">
            {{ consent?.push ? t('notifications.disable') : t('notifications.enable') }}
          </button>
          <p class="mt-2 text-xs text-gray-500">{{ t('notifications.deviceStatus') }}: {{ push.permission.value === 'granted' ? t('notifications.allowed') : t('notifications.notAllowed') }}</p>
        </div>
        <div class="rounded-3xl bg-gray-50 p-5">
          <h2 class="font-bold text-gray-950">SMS</h2>
          <p class="mt-1 text-sm text-gray-600">{{ t('notifications.smsUnavailable') }}</p>
        </div>
      </div>
    </AuthRequired>
  </PageShell>
</template>
