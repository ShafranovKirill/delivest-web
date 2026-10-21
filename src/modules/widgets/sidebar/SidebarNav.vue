<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useSidebarStore } from './sidebar.store'
import { useBranchNavigation } from '@/modules/branch/composables/useBranchNavigation'

defineProps<{
  title?: string
  items: Array<{ route: string; label: string; icon: string }>
}>()

const route = useRoute()
const sidebarStore = useSidebarStore()
const navigateTo = useBranchNavigation()

function open(routeName: string) {
  sidebarStore.setSidebarVisible(false)
  navigateTo(routeName)
}
</script>

<template>
  <nav class="flex flex-col gap-0.5">
    <span v-if="title" class="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
      {{ title }}
    </span>
    <button
      v-for="item in items"
      :key="item.route"
      type="button"
      class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-left cursor-pointer transition-colors"
      :class="
        route.name === item.route
          ? 'bg-primary-soft text-primary'
          : 'text-gray-800 hover:bg-gray-100'
      "
      @click="open(item.route)"
    >
      <i
        :class="[item.icon, 'w-5 text-center', route.name === item.route ? '' : 'text-gray-500']"
      />
      {{ item.label }}
    </button>
  </nav>
</template>
