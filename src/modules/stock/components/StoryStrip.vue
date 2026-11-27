<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { productPhotoQueueKey } from '@/modules/menu/utils/productPhotoQueue'
import { useStocksQuery } from '../composables/useStocksQuery'
import { useStoryRoute } from '../composables/useStoryRoute'
import StoryCard from './StoryCard.vue'

const { data } = useStocksQuery()
const { open } = useStoryRoute()
const photoQueue = inject(productPhotoQueueKey, null)

const stories = computed(() => data.value ?? [])
const storyKey = computed(() =>
  stories.value.map((story) => `${story.id}:${story.photo_url}`).join('|'),
)
const cards = ref<HTMLElement | null>(null)
const coversPending = ref(false)
let coverObserver: MutationObserver | undefined
let generation = 0

watch(
  storyKey,
  async () => {
    const currentGeneration = ++generation
    coverObserver?.disconnect()
    coverObserver = undefined
    coversPending.value = stories.value.length > 0
    if (!coversPending.value) return

    await nextTick()
    if (currentGeneration !== generation || !cards.value) return

    const viewport = cards.value.getBoundingClientRect()
    const visibleCards = Array.from(
      cards.value.querySelectorAll<HTMLElement>('.story-card'),
    ).filter((card) => {
      const bounds = card.getBoundingClientRect()
      return bounds.left < viewport.right && bounds.right > viewport.left
    })
    if (!visibleCards.length) {
      coversPending.value = false
      return
    }

    const revealWhenReady = () => {
      if (visibleCards.every((card) => card.getAttribute('aria-busy') !== 'true')) {
        coversPending.value = false
        coverObserver?.disconnect()
        coverObserver = undefined
      }
    }
    coverObserver = new MutationObserver(revealWhenReady)
    for (const card of visibleCards) {
      coverObserver.observe(card, { attributes: true, attributeFilter: ['aria-busy'] })
    }
    revealWhenReady()
  },
  { immediate: true, flush: 'post' },
)

onBeforeUnmount(() => coverObserver?.disconnect())
</script>

<template>
  <section
    v-if="stories.length"
    class="story-strip relative w-full max-w-7xl mx-auto pb-4"
    :class="{ 'story-strip--loading': coversPending }"
    :aria-busy="coversPending"
  >
    <div
      ref="cards"
      @scroll.passive="photoQueue?.viewportChanged()"
      class="story-cards flex min-h-52 gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-[21px] pl-[21px] pr-4 py-2 [scrollbar-width:none] sm:min-h-[15.667rem]"
    >
      <StoryCard
        v-for="story in stories"
        :key="story.id"
        :story="story"
        class="story-card shrink-0 snap-start w-36 sm:w-44"
        @open="open(story.id!)"
      />
    </div>
    <div
      class="story-loading-carousel pointer-events-none absolute inset-0 overflow-hidden py-2"
      aria-hidden="true"
    >
      <div class="story-loading-track flex w-max pl-[21px]">
        <div v-for="group in 2" :key="group" class="flex shrink-0">
          <div
            v-for="card in 9"
            :key="card"
            class="story-loading-tile aspect-3/4 w-36 shrink-0 rounded-3xl outline-2 outline-offset-2 outline-primary sm:w-44"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.story-strip {
  --story-placeholder-background: color-mix(
    in srgb,
    var(--color-gray-50) 65%,
    var(--color-gray-200)
  );
  --story-placeholder-neutral: color-mix(in srgb, var(--color-gray-300) 65%, var(--color-gray-200));
}

.story-card {
  background-color: var(--story-placeholder-neutral);
}

.story-loading-tile,
.story-card[aria-busy='true'] {
  background-color: var(--story-placeholder-background);
}

.story-loading-tile {
  position: relative;
  overflow: hidden;
}

.story-loading-tile::after,
.story-card[aria-busy='true']::after {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: 0;
  background-color: var(--color-primary-fill);
  opacity: 0.48;
  mask: url('../assets/story-cafe-pattern.svg') center / 100% 100% no-repeat;
}

.story-loading-carousel {
  display: none;
}

.story-strip--loading:not(:focus-within) .story-loading-carousel {
  display: block;
}

.story-strip--loading:not(:focus-within) .story-cards {
  opacity: 0;
}

.story-loading-track {
  --story-card-width: 9rem;
  --story-loading-gap: 1.25rem;
  gap: var(--story-loading-gap);
  animation: story-cards-loop 6s infinite;
}

.story-loading-track > div {
  gap: var(--story-loading-gap);
}

@media (min-width: 40rem) {
  .story-loading-track {
    --story-card-width: 11rem;
  }
}

@keyframes story-cards-loop {
  0% {
    transform: translateX(0);
    animation-timing-function: cubic-bezier(0.55, 0, 0.45, 1);
  }
  33.333% {
    transform: translateX(calc(-3 * (var(--story-card-width) + var(--story-loading-gap))));
    animation-timing-function: cubic-bezier(0.55, 0, 0.45, 1);
  }
  66.667% {
    transform: translateX(calc(-6 * (var(--story-card-width) + var(--story-loading-gap))));
    animation-timing-function: cubic-bezier(0.55, 0, 0.45, 1);
  }
  100% {
    transform: translateX(calc(-9 * (var(--story-card-width) + var(--story-loading-gap))));
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-loading-track {
    animation: none;
  }
}
</style>
