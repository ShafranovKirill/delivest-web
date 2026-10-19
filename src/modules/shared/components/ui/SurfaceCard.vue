<script setup lang="ts">
/**
 * Rounded content card. Optional header: an icon chip, a small uppercase label
 * and/or a title. Use `as` to render it as a link or button.
 */
withDefaults(
  defineProps<{
    icon?: string
    label?: string
    title?: string
    as?: string
    padded?: boolean
  }>(),
  { as: 'div', padded: true },
)
</script>

<template>
  <component
    :is="as"
    class="block rounded-3xl bg-gray-50 border border-gray-100"
    :class="padded ? 'p-4 sm:p-6' : ''"
  >
    <div v-if="icon || label || title || $slots.aside" class="flex items-start gap-3 sm:gap-4">
      <span
        v-if="icon"
        class="grid place-items-center size-11 shrink-0 rounded-2xl bg-white text-primary shadow-xs"
      >
        <i :class="['pi', icon, 'text-lg']" />
      </span>
      <div class="min-w-0 flex-1" :class="{ 'pt-0.5': icon }">
        <p
          v-if="label"
          class="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400"
        >
          {{ label }}
        </p>
        <h2 v-if="title" class="text-base sm:text-lg font-bold text-gray-950">{{ title }}</h2>
        <div v-if="$slots.value" class="mt-0.5 text-base font-semibold text-gray-900 break-words">
          <slot name="value" />
        </div>
      </div>
      <div v-if="$slots.aside" class="shrink-0 self-center">
        <slot name="aside" />
      </div>
    </div>

    <div v-if="$slots.default" :class="{ 'mt-4': icon || label || title }">
      <slot />
    </div>
  </component>
</template>
