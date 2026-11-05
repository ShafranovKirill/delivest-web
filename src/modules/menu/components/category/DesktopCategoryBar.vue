<script setup lang="ts">
import LoyaltyCategoryButton from '@/modules/account/components/LoyaltyCategoryButton.vue'
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { useMenuQuery } from '../../composables/useMenuQuery'
import { storeToRefs } from 'pinia'
import { useMenuStore } from '../../stores/menu.store'
import SkeletonCategoryBar from './SkeletonCategoryBar.vue'
import { useI18n } from 'vue-i18n'
import { useResizeObserver } from '@vueuse/core'
import { useBranchStore } from '@/modules/branch/stores/branch.store'

const { data: menu, isLoading } = useMenuQuery()
const menuStore = useMenuStore()
const branchStore = useBranchStore()
const { t } = useI18n()
const { activeCategoryId } = storeToRefs(menuStore)

const loyaltyRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const measurementRef = ref<HTMLElement | null>(null)
const measurementItemRefs = ref<HTMLElement[]>([])
const measurementMoreRef = ref<HTMLElement | null>(null)
const visibleCount = ref(0)

const categories = computed(() => {
  if (!menu.value) return []
  return menu.value.filter((cat) => (cat.products?.length ?? 0) > 0)
})

const updateVisibleCount = async () => {
  await nextTick()
  const container = containerRef.value
  if (!container || !measurementMoreRef.value) return
  const elements = categories.value.map((_, index) => measurementItemRefs.value[index])
  if (elements.some((element) => !element)) return
  const widths = elements.map((element) => element!.getBoundingClientRect().width)

  const style = getComputedStyle(container)
  const contentWidth =
    container.getBoundingClientRect().width -
    parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight)
  const gap = parseFloat(style.columnGap) || 0
  const loyaltyWidth = loyaltyRef.value?.getBoundingClientRect().width ?? 0
  const loyaltyCount = loyaltyRef.value ? 1 : 0
  const moreWidth = measurementMoreRef.value.getBoundingClientRect().width
  const fits = (count: number, hasMore: boolean) => {
    const itemCount = loyaltyCount + count + Number(hasMore)
    const itemsWidth = widths.slice(0, count).reduce((sum, width) => sum + width, loyaltyWidth)
    return itemsWidth + (hasMore ? moreWidth : 0) + Math.max(0, itemCount - 1) * gap <= contentWidth
  }

  if (fits(categories.value.length, false)) {
    visibleCount.value = categories.value.length
    return
  }

  let count = 0
  while (count < categories.value.length - 1 && fits(count + 1, true)) count++
  visibleCount.value = count
}

const isHiddenActive = computed(() => {
  const hiddenCategories = categories.value.slice(visibleCount.value)
  return hiddenCategories.some((c) => c.id === activeCategoryId.value)
})

useResizeObserver(loyaltyRef, updateVisibleCount)
useResizeObserver(containerRef, updateVisibleCount)
useResizeObserver(measurementRef, updateVisibleCount)

onMounted(() => {
  updateVisibleCount()
  document.fonts.ready.then(updateVisibleCount)
})

watch(categories, updateVisibleCount, { deep: true })
</script>

<template>
  <div class="bg-gray-200 w-full sticky top-15 z-50">
    <div class="bg-white rounded-t-full w-full min-h-22">
      <div
        ref="containerRef"
        data-testid="desktop-category-nav"
        class="relative whitespace-nowrap flex gap-4 max-w-7xl mx-auto py-6 px-12 2xl:px-2 items-center"
      >
        <div aria-hidden="true" inert class="absolute size-0 overflow-hidden pointer-events-none">
          <div ref="measurementRef" class="invisible w-max flex gap-4">
            <div
              v-for="(category, index) in categories"
              :key="category.id"
              :ref="(el) => (measurementItemRefs[index] = el as HTMLElement)"
              class="shrink-0"
            >
              <Button
                rounded
                class="shrink-0 whitespace-nowrap border-0!"
                severity="secondary"
                outlined
              >
                <p class="font-bold!">{{ category.name }}</p>
              </Button>
            </div>
            <div ref="measurementMoreRef" class="shrink-0">
              <div class="py-2">
                <Button
                  rounded
                  class="border-0! gap-2 whitespace-nowrap"
                  severity="secondary"
                  outlined
                >
                  <p class="font-bold!">{{ t('menu.more') }}</p>
                  <i class="pi pi-chevron-down text-sm pt-1 shrink-0"></i>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="branchStore.activeBranch?.branch_info?.loyalty?.enabled"
          ref="loyaltyRef"
          class="shrink-0"
        >
          <LoyaltyCategoryButton />
        </div>
        <SkeletonCategoryBar v-if="isLoading" />
        <Button
          v-for="category in categories.slice(0, visibleCount)"
          :key="category.id"
          :aria-current="menuStore.isActive(category.id) ? 'true' : undefined"
          :severity="activeCategoryId === category.id ? 'primary' : 'secondary'"
          :outlined="activeCategoryId !== category.id"
          rounded
          @click="menuStore.scrollToCategory(category.id)"
          class="shrink-0 whitespace-nowrap border-0!"
        >
          <p class="font-bold!">{{ category.name }}</p>
        </Button>

        <div
          v-if="visibleCount < categories.length"
          data-testid="desktop-category-more"
          class="relative group shrink-0"
        >
          <div class="py-2">
            <Button
              rounded
              class="border-0! gap-2 whitespace-nowrap"
              :severity="isHiddenActive ? 'primary' : 'secondary'"
              :outlined="!isHiddenActive"
            >
              <p class="font-bold!">{{ t('menu.more') }}</p>

              <i class="pi pi-chevron-down text-sm pt-1 shrink-0"></i>
            </Button>
          </div>

          <div
            class="absolute top-full right-0 mt-0 bg-white shadow-2xl rounded-xl p-2 hidden group-hover:block w-56 max-h-[60vh] overflow-y-auto z-100"
          >
            <div
              v-for="cat in categories.slice(visibleCount)"
              :key="cat.id"
              class="px-4 py-2 cursor-pointer hover:bg-gray-100 rounded transition-colors"
              :class="{ ' text-primary-500': activeCategoryId === cat.id }"
              @click="menuStore.scrollToCategory(cat.id)"
            >
              <p class="font-bold! text-gray-500 whitespace-normal [overflow-wrap:anywhere]">
                {{ cat.name }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
