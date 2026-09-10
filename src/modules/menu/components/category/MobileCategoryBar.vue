<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMenuQuery } from '../../composables/useMenuQuery'
import { useMobCatBarScroll } from '../../composables/useMobCatBarScroll'
import { storeToRefs } from 'pinia'
import { useMenuStore } from '../../stores/menu.store'

const { data: menu } = useMenuQuery()
const menuStore = useMenuStore()
const categories = computed(() => {
  if (!menu.value) return []

  return menu.value.filter((category) => category.products && category.products.length > 0)
})
const containerRef = ref<HTMLElement | null>(null)
const { activeCategoryId } = storeToRefs(menuStore)
useMobCatBarScroll(activeCategoryId, containerRef)
</script>
<template>
  <div class="bg-gray-200 w-full sticky top-15 z-50">
    <div class="py-4 bg-white rounded-t-4xl w-full overflow-hidden">
      <div ref="containerRef" class="flex overflow-x-auto scrollbar-none max-w-7xl mx-auto">
        <Button
          v-for="category in categories"
          :key="category.id"
          :data-id="category.id"
          class="shrink-0 transition-all duration-200 border-none! ml-4"
          @click="menuStore.scrollToCategory(category.id)"
          :severity="menuStore.isActive(category.id) ? 'primary' : 'secondary'"
          :outlined="!menuStore.isActive(category.id)"
          rounded
        >
          <p class="font-bold">{{ category.name }}</p>
        </Button>
      </div>
    </div>
  </div>
</template>
