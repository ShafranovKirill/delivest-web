<script setup lang="ts">
import { computed } from 'vue'
import { useStocksQuery } from '../composables/useStocksQuery'
import { useStoryRoute } from '../composables/useStoryRoute'
import StoryCard from './StoryCard.vue'

const { data } = useStocksQuery()
const { open } = useStoryRoute()

const stories = computed(() => data.value ?? [])
</script>

<template>
  <section v-if="stories.length" class="w-full max-w-7xl mx-auto pb-4">
    <div
      class="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-[21px] pl-[21px] pr-4 py-2 [scrollbar-width:none]"
    >
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
