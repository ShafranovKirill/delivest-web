<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEventListener, useScrollLock } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { PRODUCT_QUERY_KEY } from '@/modules/menu/composables/useProductRoute'
import { useStocksQuery } from '../composables/useStocksQuery'
import { useStoryRoute } from '../composables/useStoryRoute'
import { useStoryPlayer } from '../composables/useStoryPlayer'
import { useSeenStories } from '../composables/useSeenStories'
import StoryProgress from './StoryProgress.vue'

const STORY_DURATION = 6000
const SWIPE_CLOSE_DISTANCE = 80
const TAP_MAX_MS = 250

const { t } = useI18n()
const branchStore = useBranchStore()
const { data } = useStocksQuery()
const { storyId, show, close, leaveTo } = useStoryRoute()
const { markSeen } = useSeenStories()

const stories = computed(() => data.value ?? [])
const index = computed(() => stories.value.findIndex((story) => story.id === storyId.value))
const current = computed(() => stories.value[index.value] ?? null)

const loaded = ref(false)
const frame = ref<HTMLElement | null>(null)
const isOpen = computed(() => current.value !== null)
const playing = computed(() => isOpen.value && loaded.value)

const { progress, held, restart } = useStoryPlayer(playing, STORY_DURATION, next)

const scrollLock = useScrollLock(document.body)
watch(isOpen, (open) => (scrollLock.value = open), { immediate: true })

watch(
  () => current.value?.id,
  (id) => {
    loaded.value = false
    restart()
    if (id) markSeen(id)
  },
  { immediate: true },
)

function next() {
  const following = stories.value[index.value + 1]
  if (following?.id) show(following.id)
  else close()
}

function previous() {
  const preceding = stories.value[index.value - 1]
  if (preceding?.id) show(preceding.id)
  else restart()
}

let start = { x: 0, y: 0, at: 0 }

function onPointerDown(event: PointerEvent) {
  start = { x: event.clientX, y: event.clientY, at: event.timeStamp }
  held.value = true
}

function onPointerUp(event: PointerEvent) {
  held.value = false
  const dy = event.clientY - start.y
  if (dy > SWIPE_CLOSE_DISTANCE) return close()
  if (event.timeStamp - start.at > TAP_MAX_MS || Math.abs(dy) > 10) return

  const bounds = frame.value?.getBoundingClientRect()
  if (bounds && event.clientX - bounds.left < bounds.width / 3) previous()
  else next()
}

useEventListener(document, 'keydown', (event: KeyboardEvent) => {
  if (!isOpen.value) return
  if (event.key === 'Escape') close()
  if (event.key === 'ArrowRight') next()
  if (event.key === 'ArrowLeft') previous()
})

function openProduct() {
  const slug = current.value?.product_slug
  const branchSlug = branchStore.activeBranch?.slug
  if (!slug || !branchSlug) return

  leaveTo({ name: 'menu', params: { slug: branchSlug }, query: { [PRODUCT_QUERY_KEY]: slug } })
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="current"
        class="fixed inset-0 z-1000 grid place-items-center bg-black/90 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        :aria-label="t('stock.single')"
        @click.self="close"
      >
        <div
          ref="frame"
          class="relative h-dvh w-full overflow-hidden bg-black select-none touch-none md:h-[min(90vh,820px)] md:w-auto md:aspect-9/16 md:rounded-3xl"
          @pointerdown="onPointerDown"
          @pointerup="onPointerUp"
          @pointercancel="held = false"
          @contextmenu.prevent
        >
          <img
            :key="`${current.id}-backdrop`"
            :src="current.photo_url"
            alt=""
            aria-hidden="true"
            draggable="false"
            class="absolute inset-0 size-full scale-125 object-cover blur-2xl brightness-50 saturate-150"
          />
          <img
            :key="current.id"
            :src="current.photo_url"
            :alt="current.text || t('stock.single')"
            draggable="false"
            class="absolute inset-0 size-full object-contain"
            @load="loaded = true"
            @error="loaded = true"
          />

          <div
            class="absolute inset-x-0 top-0 bg-linear-to-b from-black/60 to-transparent px-3 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]"
          >
            <StoryProgress :count="stories.length" :index="index" :progress="progress" />
            <div class="mt-3 flex justify-end">
              <button
                type="button"
                class="grid size-9 place-items-center rounded-full bg-black/30 text-white cursor-pointer"
                :aria-label="t('common.close')"
                @pointerdown.stop
                @pointerup.stop
                @click="close"
              >
                <i-tabler-x class="size-5" />
              </button>
            </div>
          </div>

          <div
            v-if="current.text || current.product_slug"
            class="absolute inset-x-0 bottom-0 flex flex-col gap-4 bg-linear-to-t from-black/80 via-black/40 to-transparent px-5 pt-20 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          >
            <p v-if="current.text" class="text-lg font-semibold leading-snug text-white">
              {{ current.text }}
            </p>
            <button
              v-if="current.product_slug"
              type="button"
              class="h-12 rounded-full bg-[#fff] px-6 font-semibold text-[#111] cursor-pointer"
              @pointerdown.stop
              @pointerup.stop
              @click="openProduct"
            >
              {{ t('stock.toProduct') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
