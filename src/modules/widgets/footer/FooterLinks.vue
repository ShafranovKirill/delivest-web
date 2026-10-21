<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  title: string
  links: Array<{ label: string; to?: RouteLocationRaw; action?: () => void }>
}>()

const linkClass =
  'text-sm text-gray-600 hover:text-primary transition-colors text-left cursor-pointer'
</script>

<template>
  <nav class="flex flex-col gap-3">
    <span class="text-xs font-semibold uppercase tracking-wide text-gray-400">{{ title }}</span>
    <template v-for="link in links" :key="link.label">
      <RouterLink v-if="link.to" :to="link.to" :class="linkClass">{{ link.label }}</RouterLink>
      <button v-else type="button" :class="linkClass" @click="link.action">
        {{ link.label }}
      </button>
    </template>
  </nav>
</template>
