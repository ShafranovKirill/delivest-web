<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Nutrition {
  calories?: number | null
  proteins?: number | null
  fats?: number | null
  carbohydrates?: number | null
}

const props = defineProps<{ nutrition?: Nutrition | null }>()

const { t } = useI18n()

const rows = computed(() =>
  [
    { key: 'calories', unit: t('menu.nutrition.kcal') },
    { key: 'proteins', unit: t('menu.nutrition.g') },
    { key: 'fats', unit: t('menu.nutrition.g') },
    { key: 'carbohydrates', unit: t('menu.nutrition.g') },
  ].flatMap(({ key, unit }) => {
    const value = props.nutrition?.[key as keyof Nutrition]
    return typeof value === 'number' ? [{ key, value, unit }] : []
  }),
)
</script>

<template>
  <div v-if="rows.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
    <p class="text-[11px] font-medium text-gray-500">
      {{ t('menu.nutrition.per100') }}
    </p>
    <div class="flex flex-wrap gap-1 text-xs text-gray-600">
      <span v-for="row in rows" :key="row.key" class="rounded-md bg-gray-100 px-1.5 py-0.5">
        {{ t(`menu.nutrition.${row.key}`) }} <b class="text-gray-900">{{ row.value }}</b>
        {{ row.unit }}
      </span>
    </div>
  </div>
</template>
