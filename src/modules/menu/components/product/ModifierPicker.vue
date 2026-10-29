<script setup lang="ts">
import { formatPrice } from '@/utils/money'
import type { MenuProduct } from '@/modules/menu/api/menu.service'

type Group = NonNullable<MenuProduct['modifier_groups']>[number]

defineProps<{ groups: Group[] }>()
const selected = defineModel<string[]>({ required: true })

function single(group: Group) {
  return group.is_size || group.max === 1
}

function toggle(group: Group, id: string) {
  const ids = group.modifiers.map((m) => m.id)
  const rest = selected.value.filter((s) => !ids.includes(s))
  const mine = selected.value.filter((s) => ids.includes(s))

  if (single(group)) {
    selected.value = mine.includes(id) && group.min === 0 ? rest : [...rest, id]
  } else if (mine.includes(id)) {
    selected.value = selected.value.filter((s) => s !== id)
  } else if (mine.length < group.max) {
    selected.value = [...selected.value, id]
  }
}
</script>

<template>
  <div class="space-y-4">
    <div v-for="group in groups" :key="group.id">
      <p class="mb-2 text-sm font-semibold text-gray-900">{{ group.name }}</p>
      <div
        :class="group.is_size ? 'flex gap-1 rounded-full bg-gray-100 p-1' : 'flex flex-wrap gap-2'"
      >
        <button
          v-for="modifier in group.modifiers"
          :key="modifier.id"
          type="button"
          :disabled="modifier.stopped"
          @click="toggle(group, modifier.id)"
          class="px-3 py-1.5 text-sm transition-colors disabled:opacity-40"
          :class="[
            group.is_size ? 'flex-1 rounded-full' : 'rounded-xl border',
            selected.includes(modifier.id)
              ? group.is_size
                ? 'bg-white font-semibold shadow-sm'
                : 'border-(--p-primary-color) bg-(--p-primary-color)/10'
              : group.is_size
                ? 'text-gray-600'
                : 'border-gray-200',
          ]"
        >
          {{ modifier.name }}
          <span v-if="modifier.price > 0" class="text-gray-500">
            +{{ formatPrice(modifier.price) }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
