<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useMenuQuery } from '../../composables/useMenuQuery'
import { storeToRefs } from 'pinia'
import { useMenuStore } from '../../stores/menu.store'

const { data: menu } = useMenuQuery()
const menuStore = useMenuStore()
const { activeCategoryId } = storeToRefs(menuStore)

const containerRef = ref<HTMLElement | null>(null)
const itemRefs = ref<HTMLElement[]>([])
const visibleCount = ref(999)

const categories = computed(() => {
  if (!menu.value) return []
  return menu.value.filter((cat) => (cat.products?.length ?? 0) > 0)
})

const updateVisibleCount = async () => {
  await nextTick()
  if (!containerRef.value || itemRefs.value.length === 0) return

  const containerWidth = containerRef.value.offsetWidth
  let currentWidth = 0
  let count = 0
  const moreBtnWidth = 120

  for (let i = 0; i < categories.value.length; i++) {
    const el = itemRefs.value[i]
    const itemWidth = el?.offsetWidth || 100

    if (currentWidth + itemWidth + 16 + moreBtnWidth > containerWidth) {
      break
    }

    currentWidth += itemWidth + 16
    count++
  }

  visibleCount.value =
    count > 0 && count < categories.value.length ? count - 1 : categories.value.length
}

const activeCategoryName = computed(() => {
  const active = categories.value.find((c) => c.id === activeCategoryId.value)
  return active ? active.name : null
})

const isHiddenActive = computed(() => {
  const hiddenCategories = categories.value.slice(visibleCount.value)
  return hiddenCategories.some((c) => c.id === activeCategoryId.value)
})

onMounted(() => {
  window.addEventListener('resize', updateVisibleCount)
  updateVisibleCount()
})

onUnmounted(() => window.removeEventListener('resize', updateVisibleCount))
watch(categories, updateVisibleCount, { deep: true })
</script>

<template>
  <div class="bg-gray-200 w-full sticky top-0 z-50">
    <div class="bg-white rounded-t-full w-full min-h-20">
      <div
        ref="containerRef"
        class="whitespace-nowrap flex gap-4 max-w-7xl mx-auto py-3 px-12 2xl:px-2 items-center"
      >
        <Button
          v-for="(category, index) in categories.slice(0, visibleCount)"
          :key="category.id"
          :ref="(el) => (itemRefs[index] = el as any)"
          :severity="activeCategoryId === category.id ? 'primary' : 'secondary'"
          :outlined="activeCategoryId !== category.id"
          rounded
          @click="menuStore.scrollToCategory(category.id)"
          class="whitespace-nowrap border-0!"
        >
          <p class="font-bold!">{{ category.name }}</p>
        </Button>

        <div v-if="visibleCount < categories.length" class="relative group">
          <div class="py-2">
            <Button
              rounded
              class="border-0! gap-2"
              :severity="isHiddenActive ? 'primary' : 'secondary'"
              :outlined="!isHiddenActive"
            >
              <p class="font-bold!">{{ isHiddenActive ? activeCategoryName : 'Ещё' }}</p>

              <i class="pi pi-chevron-down text-sm pt-1"></i>
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
              <p class="font-bold! text-gray-500">{{ cat.name }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
