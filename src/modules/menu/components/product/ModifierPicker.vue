<script setup lang="ts">
import { formatPrice } from '@/utils/money'
import type { MenuProduct } from '@/modules/menu/api/menu.service'

type Group = NonNullable<MenuProduct['modifier_groups']>[number]

defineProps<{ groups: Group[] }>()
const selected = defineModel<string[]>({ required: true })

function hasPhotos(group: Group) {
  return group.modifiers.some((m) => m.photo_url)
}

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

      <div v-if="group.is_size" class="flex gap-1 rounded-full bg-gray-100 p-1">
        <button
          v-for="modifier in group.modifiers"
          :key="modifier.id"
          type="button"
          :disabled="modifier.stopped"
          @click="toggle(group, modifier.id)"
          class="flex-1 rounded-full px-3 py-1.5 text-sm transition-colors disabled:opacity-40"
          :class="
            selected.includes(modifier.id) ? 'bg-white font-semibold shadow-sm' : 'text-gray-600'
          "
        >
          {{ modifier.name }}
        </button>
      </div>

      <div v-else-if="hasPhotos(group)" class="grid grid-cols-3 gap-2">
        <button
          v-for="modifier in group.modifiers"
          :key="modifier.id"
          type="button"
          :disabled="modifier.stopped"
          @click="toggle(group, modifier.id)"
          class="flex flex-col overflow-hidden rounded-2xl border-2 bg-white text-center text-sm transition-colors disabled:opacity-40"
          :class="selected.includes(modifier.id) ? 'border-(--p-primary-color)' : 'border-gray-100'"
        >
          <span class="grid aspect-square w-full place-items-center bg-gray-50">
            <img
              v-if="modifier.photo_url"
              :src="modifier.photo_url"
              :alt="modifier.name"
              loading="lazy"
              class="size-full object-cover"
            />
            <i v-else class="pi pi-image text-2xl text-gray-300" />
          </span>
          <span class="flex flex-1 flex-col gap-0.5 px-1.5 py-2 leading-tight">
            <span class="font-medium text-gray-900">{{ modifier.name }}</span>
            <span v-if="modifier.price > 0" class="text-xs text-gray-500">
              +{{ formatPrice(modifier.price) }}
            </span>
          </span>
        </button>
      </div>

      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="modifier in group.modifiers"
          :key="modifier.id"
          type="button"
          :disabled="modifier.stopped"
          @click="toggle(group, modifier.id)"
          class="rounded-xl border px-3 py-1.5 text-sm transition-colors disabled:opacity-40"
          :class="
            selected.includes(modifier.id)
              ? 'border-(--p-primary-color) bg-(--p-primary-color)/10'
              : 'border-gray-200'
          "
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
