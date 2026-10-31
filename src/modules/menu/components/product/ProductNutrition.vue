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
  <div v-if="rows.length" class="flex flex-col gap-1.5">
    <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">
      {{ t('menu.nutrition.per100') }}
    </p>
    <div class="flex flex-wrap gap-2 text-sm text-gray-600">
      <span v-for="row in rows" :key="row.key" class="rounded-md bg-gray-100 px-2.5 py-1">
        {{ t(`menu.nutrition.${row.key}`) }} <b class="text-gray-900">{{ row.value }}</b>
        {{ row.unit }}
      </span>
    </div>
  </div>
</template>
