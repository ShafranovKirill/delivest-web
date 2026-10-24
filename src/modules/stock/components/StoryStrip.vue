<script setup lang="ts">
import { computed } from 'vue'
import { useStocksQuery } from '../composables/useStocksQuery'
import { useStoryRoute } from '../composables/useStoryRoute'
import StoryCard from './StoryCard.vue'

const { data, isLoading } = useStocksQuery()
const { open } = useStoryRoute()

const stories = computed(() => data.value ?? [])
</script>

<template>
  <section v-if="isLoading || stories.length" class="w-full max-w-7xl mx-auto pb-4">
    <div
      class="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-4 px-4 py-2 [scrollbar-width:none]"
    >
      <template v-if="isLoading">
        <Skeleton
          v-for="i in 5"
          :key="i"
          class="shrink-0 w-36 sm:w-44 aspect-3/4 h-auto! rounded-3xl!"
        />
      </template>

      <StoryCard
        v-for="story in stories"
        :key="story.id"
        :story="story"
        class="shrink-0 snap-start w-36 sm:w-44"
        @open="open(story.id!)"
      />
    </div>
  </section>
</template>
