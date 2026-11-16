<script setup lang="ts">
import ResponsiveSheet from '@/modules/shared/components/ui/ResponsiveSheet.vue'
import { useI18n } from 'vue-i18n'

const visible = defineModel<boolean>('visible', { required: true })
const { t } = useI18n()

const steps = ['pwa.install.iosStep1', 'pwa.install.iosStep2', 'pwa.install.iosStep3']
</script>

<template>
  <ResponsiveSheet
    :aria-label="t('pwa.install.iosTitle')"
    v-model:visible="visible"
    desktop-class="w-[min(92vw,400px)]"
  >
    <template #header>
      <h3 class="text-xl font-extrabold text-gray-950">{{ t('pwa.install.iosTitle') }}</h3>
    </template>

    <ol class="flex flex-col gap-3">
      <li v-for="(step, index) in steps" :key="step" class="flex items-center gap-3">
        <span
          class="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary"
        >
          {{ index + 1 }}
        </span>
        <span class="text-sm text-gray-800">{{ t(step) }}</span>
      </li>
    </ol>
  </ResponsiveSheet>
</template>
