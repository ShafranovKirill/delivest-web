<script setup lang="ts">
defineProps<{ kind: 'branch' | 'contacts' | 'stock' }>()
</script>

<template>
  <svg
    v-if="kind === 'branch'"
    viewBox="0 0 240 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    class="block w-full"
  >
    <circle cx="192" cy="31" r="15" fill="currentColor" opacity=".16" />
    <path
      d="M20 130h203"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      opacity=".32"
    />
    <rect x="51" y="51" width="141" height="79" rx="8" fill="currentColor" opacity=".13" />
    <path d="M51 51h141v79H51z" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
    <path d="M44 52 59 24h125l15 28" fill="currentColor" opacity=".3" />
    <path
      d="M44 52 59 24h125l15 28"
      stroke="currentColor"
      stroke-width="3"
      stroke-linejoin="round"
    />
    <path
      d="M44 52c0 11 16 15 21 4 5 11 19 11 24 0 5 11 19 11 24 0 5 11 19 11 24 0 5 11 19 11 24 0 5 11 19 11 24 0 5 11 21 7 21-4H44Z"
      fill="currentColor"
      opacity=".4"
    />
    <path
      d="M44 52c0 11 16 15 21 4 5 11 19 11 24 0 5 11 19 11 24 0 5 11 19 11 24 0 5 11 19 11 24 0 5 11 19 11 24 0 5 11 21 7 21-4H44Z"
      stroke="currentColor"
      stroke-width="3"
      stroke-linejoin="round"
    />
    <path d="M65 72h38v37H65z" fill="currentColor" opacity=".12" />
    <path
      d="M65 72h38v37H65zM84 72v37"
      stroke="currentColor"
      stroke-width="3"
      stroke-linejoin="round"
    />
    <path
      d="M124 130V72h48v58"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path d="M147 73v57m15-32h1" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    <path
      d="M104 130h85"
      stroke="currentColor"
      stroke-width="5"
      stroke-linecap="round"
      opacity=".4"
    />
  </svg>

  <svg
    v-else-if="kind === 'contacts'"
    viewBox="0 0 240 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    class="block w-full"
  >
    <path
      d="M31 45c0-17 14-30 31-30h82c18 0 32 13 32 30v35c0 17-14 30-32 30H82l-29 19v-21c-13-4-22-15-22-28V45Z"
      fill="currentColor"
      opacity=".13"
    />
    <path
      d="M31 45c0-17 14-30 31-30h82c18 0 32 13 32 30v35c0 17-14 30-32 30H82l-29 19v-21c-13-4-22-15-22-28V45Z"
      stroke="currentColor"
      stroke-width="3"
      stroke-linejoin="round"
    />
    <path
      d="M174 52h19c12 0 21 9 21 21v26c0 12-9 21-21 21h-10l-17 14v-14h-20"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity=".55"
    />
    <path
      d="M79 44c4-4 9-3 13 2l6 8c3 4 2 8-2 11l-5 4c5 9 12 16 21 21l4-5c3-4 7-5 11-2l8 6c5 4 6 9 2 13-5 6-12 8-19 5-18-7-36-25-43-43-3-7-1-14 4-20Z"
      fill="currentColor"
      opacity=".42"
    />
    <path
      d="M79 44c4-4 9-3 13 2l6 8c3 4 2 8-2 11l-5 4c5 9 12 16 21 21l4-5c3-4 7-5 11-2l8 6c5 4 6 9 2 13-5 6-12 8-19 5-18-7-36-25-43-43-3-7-1-14 4-20Z"
      stroke="currentColor"
      stroke-width="3"
      stroke-linejoin="round"
    />
    <circle cx="191" cy="85" r="3" fill="currentColor" />
    <circle cx="203" cy="85" r="3" fill="currentColor" />
  </svg>

  <svg
    v-else
    viewBox="0 0 240 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    class="block w-full"
  >
    <path
      d="m72 30 133 23-6 34c-9-1-16 4-18 12-1 9 4 16 12 18l-5 25-133-23 5-25c9 1 16-4 18-12 1-9-4-16-12-18l6-34Z"
      fill="currentColor"
      opacity=".15"
    />
    <path
      d="m72 30 133 23-6 34c-9-1-16 4-18 12-1 9 4 16 12 18l-5 25-133-23 5-25c9 1 16-4 18-12 1-9-4-16-12-18l6-34Z"
      stroke="currentColor"
      stroke-width="3"
      stroke-linejoin="round"
    />
    <path
      d="m58 18 124 10-3 30c-9-1-16 5-17 14-1 8 5 16 14 17l-3 29-124-10 3-29c9 0 16-6 17-14 1-9-5-16-14-17l3-30Z"
      fill="var(--page-hero-bg)"
    />
    <path
      d="m58 18 124 10-3 30c-9-1-16 5-17 14-1 8 5 16 14 17l-3 29-124-10 3-29c9 0 16-6 17-14 1-9-5-16-14-17l3-30Z"
      fill="currentColor"
      opacity=".25"
    />
    <path
      d="m58 18 124 10-3 30c-9-1-16 5-17 14-1 8 5 16 14 17l-3 29-124-10 3-29c9 0 16-6 17-14 1-9-5-16-14-17l3-30Z"
      stroke="currentColor"
      stroke-width="3"
      stroke-linejoin="round"
    />
    <path
      d="m83 42 70 6M80 91l70 6"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      opacity=".45"
    />
    <circle cx="117" cy="69" r="17" stroke="currentColor" stroke-width="3" />
    <path d="m108 78 18-18" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    <circle cx="107" cy="62" r="2.5" fill="currentColor" />
    <circle cx="127" cy="76" r="2.5" fill="currentColor" />
    <path
      d="m28 37 3-8m-11 1-8-4m11 23-8 3"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      opacity=".55"
    />
  </svg>
</template>
