<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProximityImageSource } from '@/modules/shared/composables/useProximityImageSource'
import { type PhotoVariant } from '../../utils/productImageSources'
import { useProductImageState } from '../../composables/useProductImageState'

const props = withDefaults(
  defineProps<{
    src?: string | null
    variants?: PhotoVariant[] | null
    sizes?: string
    alt?: string
    fit?: 'cover' | 'contain'
  }>(),
  { fit: 'cover', sizes: '(min-width: 640px) 256px, 200px' },
)

const element = ref<HTMLElement | null>(null)
const source = computed(() => props.src)
const imageSource = useProximityImageSource(element, source, '500px')
const { state, srcset, hasPhoto, onError } = useProductImageState(
  source,
  computed(() => props.variants),
  imageSource,
)
</script>

<template>
  <span ref="element" class="relative block overflow-hidden">
    <img
      v-if="state !== 'loaded'"
      src="/placeholder/product-placeholder.svg"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 size-full object-contain"
      :class="{ 'opacity-70 motion-safe:animate-[spin_8s_linear_infinite]': hasPhoto }"
    />
    <img
      v-if="hasPhoto && imageSource"
      :src="imageSource"
      :srcset="srcset"
      :sizes="srcset ? sizes : undefined"
      :alt="alt"
      loading="lazy"
      decoding="async"
      class="relative size-full transition-opacity duration-300 motion-reduce:transition-none"
      :class="[
        fit === 'cover' ? 'object-cover' : 'object-contain',
        { 'opacity-0': state !== 'loaded' },
      ]"
      @load="state = 'loaded'"
      @error="onError"
    />
  </span>
</template>
