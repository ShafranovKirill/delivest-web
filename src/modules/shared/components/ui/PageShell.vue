<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    width?: 'narrow' | 'default' | 'wide'
  }>(),
  { width: 'default' },
)

const widthClass = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-7xl',
}
</script>

<template>
  <section class="min-h-full flex flex-col w-full bg-gray-200">
    <div class="sticky top-15 z-40 w-full bg-gray-200" aria-hidden="true">
      <div class="h-8 sm:h-10 bg-white rounded-t-4xl lg:rounded-t-[2.5rem]" />
    </div>
    <div class="flex-1 w-full bg-white">
      <div class="mx-auto w-full px-4 sm:px-6 pb-10 sm:pb-14" :class="widthClass[width]">
        <header
          v-if="title || $slots.actions"
          class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8"
        >
          <div class="min-w-0">
            <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
              {{ title }}
            </h1>
            <p v-if="subtitle" class="mt-1.5 text-sm sm:text-base text-gray-500">
              {{ subtitle }}
            </p>
          </div>
          <div v-if="$slots.actions" class="shrink-0">
            <slot name="actions" />
          </div>
        </header>

        <slot />
      </div>
    </div>
  </section>
</template>
