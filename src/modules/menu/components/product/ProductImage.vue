<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{ src?: string | null; alt?: string; fit?: 'cover' | 'contain' }>(),
  { fit: 'cover' },
)

const placeholder = '/placeholder/product-placeholder.svg'
const state = ref<'loading' | 'loaded' | 'failed'>('loading')

watch(
  () => props.src,
  () => (state.value = 'loading'),
)

const hasPhoto = computed(() => Boolean(props.src) && state.value !== 'failed')
</script>

<template>
  <span class="relative block overflow-hidden">
    <img
      v-if="state !== 'loaded'"
      :src="placeholder"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 size-full object-contain"
      :class="{ 'opacity-70 motion-safe:animate-[spin_8s_linear_infinite]': hasPhoto }"
    />
    <img
      v-if="hasPhoto"
      :src="src!"
      :alt="alt"
      loading="lazy"
      decoding="async"
      class="relative size-full transition-opacity duration-300"
      :class="[
        fit === 'cover' ? 'object-cover' : 'object-contain',
        { 'opacity-0': state !== 'loaded' },
      ]"
      @load="state = 'loaded'"
      @error="state = 'failed'"
    />
  </span>
</template>
