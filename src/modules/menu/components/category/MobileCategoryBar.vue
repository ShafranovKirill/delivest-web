<script setup lang="ts">
import LoyaltyCategoryButton from '@/modules/account/components/LoyaltyCategoryButton.vue'
import { computed, ref } from 'vue'
import { useMenuQuery } from '../../composables/useMenuQuery'
import { useMobCatBarScroll } from '../../composables/useMobCatBarScroll'
import { storeToRefs } from 'pinia'
import { useMenuStore } from '../../stores/menu.store'
import SkeletonCategoryBar from './SkeletonCategoryBar.vue'
import { categoryDisplayName } from '../../utils/categoryDisplayName'
import { useI18n } from 'vue-i18n'

const { data: menu, isLoading } = useMenuQuery()
const menuStore = useMenuStore()
const { t } = useI18n()
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
    <div class="min-h-18 py-4 bg-white rounded-t-4xl w-full overflow-hidden">
      <SkeletonCategoryBar v-if="isLoading" class="px-4" />
      <div
        v-else
        ref="containerRef"
        class="flex items-center overflow-x-auto scrollbar-none max-w-7xl mx-auto -my-4 py-4"
      >
        <LoyaltyCategoryButton class="ml-4" />
        <Button
          v-for="category in categories"
          :key="category.id"
          :aria-current="menuStore.isActive(category.id) ? 'true' : undefined"
          :data-id="category.id"
          class="shrink-0 max-w-[calc(100vw-2rem)] whitespace-normal transition-all duration-200 border-none! ml-4"
          @click="menuStore.scrollToCategory(category.id)"
          :severity="menuStore.isActive(category.id) ? 'primary' : 'secondary'"
          :outlined="!menuStore.isActive(category.id)"
          rounded
        >
          <p class="font-bold whitespace-normal [overflow-wrap:anywhere]">
            {{ categoryDisplayName(category, t('menu.popular')) }}
          </p>
        </Button>
      </div>
    </div>
  </div>
</template>
