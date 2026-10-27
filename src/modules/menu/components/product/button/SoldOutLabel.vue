<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div
    class="mt-auto grid min-h-10 w-full place-items-center rounded-full bg-gray-100 px-4 py-2 font-bold text-gray-400 select-none"
  >
    {{ t('menu.soldOut') }}
  </div>
</template>
