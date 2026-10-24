<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOrderPush } from '../composables/useOrderPush'
import InstallGuideDialog from './InstallGuideDialog.vue'

const props = defineProps<{ orderId: string | null | undefined }>()

const { t } = useI18n()
const { supported, needsInstall, permission, pending, failed, enabled, enable, resume } =
  useOrderPush(() => props.orderId)
const guideVisible = ref(false)

onMounted(resume)
</script>

<template>
  <div
    v-if="needsInstall"
    class="flex items-center gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700"
  >
    <i-tabler-bell class="size-6 shrink-0 text-primary" />
    <span class="min-w-0 flex-1">{{ t('pwa.push.iosHint') }}</span>
    <button
      type="button"
      class="shrink-0 font-semibold text-primary cursor-pointer"
      @click="guideVisible = true"
    >
      {{ t('pwa.install.title') }}
    </button>
    <InstallGuideDialog v-model:visible="guideVisible" />
  </div>

  <p
    v-else-if="supported && enabled"
    class="flex items-center gap-2 rounded-3xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700"
  >
    <i-tabler-bell-ringing class="size-5" /> {{ t('pwa.push.enabled') }}
  </p>

  <p
    v-else-if="supported && permission === 'denied'"
    class="rounded-3xl bg-gray-50 px-4 py-3 text-sm text-gray-500"
  >
    {{ t('pwa.push.denied') }}
  </p>

  <div
    v-else-if="supported"
    class="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center"
  >
    <span
      class="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-xs"
    >
      <i-tabler-bell class="size-6" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block font-bold text-gray-950">{{ t('pwa.push.title') }}</span>
      <span class="block text-sm text-gray-500">
        {{ failed ? t('pwa.push.failed') : t('pwa.push.text') }}
      </span>
    </span>
    <Button
      :label="t('pwa.push.enable')"
      :loading="pending"
      rounded
      class="shrink-0 font-semibold"
      @click="enable"
    />
  </div>
</template>
