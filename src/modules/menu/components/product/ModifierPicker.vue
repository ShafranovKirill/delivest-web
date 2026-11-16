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

function atLimit(group: Group) {
  return (
    !single(group) &&
    group.modifiers.filter((m) => selected.value.includes(m.id)).length >= group.max
  )
}

function unavailable(group: Group, id: string, stopped: boolean) {
  return stopped || (atLimit(group) && !selected.value.includes(id))
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
      <p class="mb-2 text-sm font-semibold text-gray-900">
        {{ group.name === 'Добавки' ? 'Дополни вкус' : group.name }}
      </p>

      <div v-if="group.is_size" class="flex gap-1 rounded-full bg-gray-100 p-1">
        <button
          v-for="modifier in group.modifiers"
          :key="modifier.id"
          type="button"
          :disabled="modifier.stopped"
          :aria-pressed="selected.includes(modifier.id)"
          @click="toggle(group, modifier.id)"
          class="flex-1 rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--p-primary-color) disabled:opacity-40"
          :class="
            selected.includes(modifier.id) ? 'bg-white font-semibold shadow-sm' : 'text-gray-600'
          "
        >
          {{ modifier.name }}
        </button>
      </div>

      <div
        v-else-if="hasPhotos(group)"
        class="modifier-photo-list -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0"
      >
        <button
          v-for="modifier in group.modifiers"
          :key="modifier.id"
          type="button"
          :disabled="unavailable(group, modifier.id, modifier.stopped)"
          :aria-pressed="selected.includes(modifier.id)"
          @click="toggle(group, modifier.id)"
          class="relative flex w-[110px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border text-left transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--p-primary-color) disabled:cursor-not-allowed disabled:opacity-45 md:w-auto"
          :class="
            selected.includes(modifier.id)
              ? 'border-(--p-primary-color) bg-[#f8f5f1] shadow-sm dark:border-(--p-primary-color) dark:bg-gray-100'
              : 'border-[#e8e3dc] bg-[#faf8f5] hover:border-[#d6cfc5] hover:shadow-sm dark:border-gray-200 dark:bg-gray-50 dark:hover:border-gray-300'
          "
        >
          <span
            class="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-full border text-xs shadow-sm"
            :class="
              selected.includes(modifier.id)
                ? 'border-(--p-primary-color) bg-(--p-primary-color) text-white'
                : 'border-white/80 bg-white/95 text-gray-700 dark:border-gray-300 dark:bg-gray-200 dark:text-gray-900'
            "
            aria-hidden="true"
          >
            <i :class="selected.includes(modifier.id) ? 'pi pi-check' : 'pi pi-plus'" />
          </span>
          <span class="grid aspect-square w-full place-items-center">
            <img
              v-if="modifier.photo_url"
              :src="modifier.photo_url"
              alt=""
              loading="lazy"
              class="block size-full object-contain"
            />
            <i v-else class="pi pi-image text-2xl text-gray-300" aria-hidden="true" />
          </span>
          <span class="flex min-w-0 flex-1 flex-col px-1.5 py-1.5 leading-tight">
            <span class="break-words text-xs font-medium text-gray-900">{{ modifier.name }}</span>
            <span v-if="modifier.price > 0" class="text-[11px] text-gray-600">
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
          :disabled="unavailable(group, modifier.id, modifier.stopped)"
          :aria-pressed="selected.includes(modifier.id)"
          @click="toggle(group, modifier.id)"
          class="rounded-xl border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--p-primary-color) disabled:opacity-40"
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

<style scoped>
.modifier-photo-list {
  scrollbar-width: none;
  scroll-padding-inline: 1rem;
}
.modifier-photo-list::-webkit-scrollbar {
  display: none;
}
@media (min-width: 48rem) {
  .modifier-photo-list {
    scroll-padding-inline: 0;
  }
}
</style>
