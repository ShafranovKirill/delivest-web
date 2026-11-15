<script setup lang="ts">
defineProps<{
  title: string
  kind: 'reach' | 'place'
}>()
</script>

<template>
  <div
    class="contact-section-header flex min-h-24 items-center justify-between gap-3 overflow-hidden rounded-3xl border border-primary/10 px-5 py-3 sm:px-6"
  >
    <h2 class="min-w-0 text-lg font-bold leading-tight text-gray-950 sm:text-xl">{{ title }}</h2>

    <svg
      v-if="kind === 'reach'"
      viewBox="0 0 100 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="w-[85px] shrink-0 text-primary-strong"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M23 36V9c0-2 2-4 4-4h47c2 0 4 2 4 4v27"
        fill="var(--section-art-paper)"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linejoin="round"
      />
      <path
        d="M32 15h37M32 23h27"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        opacity=".5"
      />
      <path
        d="M11 34c0-3 2-5 5-5h68c3 0 5 2 5 5v29c0 3-2 5-5 5H16c-3 0-5-2-5-5V34Z"
        fill="var(--section-art-paper)"
      />
      <path
        d="M11 34c0-3 2-5 5-5h68c3 0 5 2 5 5v29c0 3-2 5-5 5H16c-3 0-5-2-5-5V34Z"
        fill="currentColor"
        opacity=".2"
      />
      <path
        d="m13 33 37 23 37-23M12 64l27-20m49 20L61 44"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M11 34c0-3 2-5 5-5h68c3 0 5 2 5 5v29c0 3-2 5-5 5H16c-3 0-5-2-5-5V34Z"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linejoin="round"
      />
    </svg>

    <svg
      v-else
      viewBox="0 0 100 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="w-[85px] shrink-0 text-primary-strong"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m8 25 27-10 28 10 29-10v46L63 71 35 61 8 71V25Z" fill="currentColor" opacity=".16" />
      <path
        d="m8 25 27-10 28 10 29-10v46L63 71 35 61 8 71V25Z"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linejoin="round"
      />
      <path d="M35 15v46m28-36v46" stroke="currentColor" stroke-width="2.5" opacity=".5" />
      <path
        d="M57 36c0 7-10 18-10 18S37 43 37 36a10 10 0 0 1 20 0Z"
        fill="var(--section-art-paper)"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linejoin="round"
      />
      <circle cx="47" cy="36" r="3" fill="currentColor" />
      <path
        d="m15 40 12-4m43 5 13-5M17 57l11-4m43 5 12-4"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        opacity=".4"
      />
    </svg>
  </div>
</template>

<style scoped>
.contact-section-header {
  --section-art-paper: var(--surface-card, white);
  background: color-mix(in srgb, var(--color-primary) 9%, var(--surface-card, white));
}
</style>
