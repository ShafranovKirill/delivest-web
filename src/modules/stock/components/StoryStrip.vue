<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStocksQuery } from '../composables/useStocksQuery'
import { useStoryRoute } from '../composables/useStoryRoute'
import { useSeenStories } from '../composables/useSeenStories'

const { t } = useI18n()
const { data, isLoading } = useStocksQuery()
const { open } = useStoryRoute()
const { isSeen } = useSeenStories()

const stories = computed(() => data.value ?? [])
</script>

<template>
  <section v-if="isLoading || stories.length" class="w-full max-w-7xl mx-auto pb-4">
    <div
      class="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-4 px-4 py-1.5 [scrollbar-width:none]"
    >
      <template v-if="isLoading">
        <Skeleton
          v-for="i in 5"
          :key="i"
          class="shrink-0 w-36 sm:w-44 aspect-3/4 h-auto! rounded-3xl!"
        />
      </template>

      <button
        v-for="story in stories"
        :key="story.id"
        type="button"
        class="group relative shrink-0 snap-start w-36 sm:w-44 aspect-3/4 overflow-hidden rounded-3xl bg-gray-300 text-left cursor-pointer"
        :class="{
          'ring-[3px] ring-primary ring-offset-2 ring-offset-gray-200': !isSeen(story.id!),
        }"
        @click="open(story.id!)"
      >
        <img
          :src="story.photo_url"
          :alt="story.text || t('stock.single')"
          loading="lazy"
          class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          v-if="story.text"
          class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-3 pt-10 pb-3"
        >
          <span class="line-clamp-3 text-[13px] font-semibold leading-snug text-white">
            {{ story.text }}
          </span>
        </span>
      </button>
    </div>
  </section>
</template>
