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
      d="M41 53c0-22 35-38 79-38s79 16 79 38l-11 13h-30l-9-12c-19-6-39-6-58 0l-9 12H52L41 53Z"
      fill="currentColor"
      opacity=".48"
    />
    <path
      d="M41 53c0-22 35-38 79-38s79 16 79 38l-11 13h-30l-9-12c-19-6-39-6-58 0l-9 12H52L41 53Z"
      stroke="currentColor"
      stroke-width="4"
      stroke-linejoin="round"
    />
    <path
      d="M52 53h30m76 0h30"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
      opacity=".62"
    />
    <path
      d="M83 69c2-10 10-17 20-17h34c10 0 18 7 20 17l19 56c2 6-3 11-9 11H73c-6 0-11-5-9-11l19-56Z"
      fill="currentColor"
      opacity=".22"
    />
    <path
      d="M83 69c2-10 10-17 20-17h34c10 0 18 7 20 17l19 56c2 6-3 11-9 11H73c-6 0-11-5-9-11l19-56Z"
      stroke="currentColor"
      stroke-width="4"
      stroke-linejoin="round"
    />
    <path d="M101 71h38" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
    <circle cx="103" cy="88" r="4" fill="currentColor" />
    <circle cx="120" cy="88" r="4" fill="currentColor" />
    <circle cx="137" cy="88" r="4" fill="currentColor" />
    <circle cx="100" cy="103" r="4" fill="currentColor" />
    <circle cx="120" cy="103" r="4" fill="currentColor" />
    <circle cx="140" cy="103" r="4" fill="currentColor" />
    <circle cx="97" cy="118" r="4" fill="currentColor" />
    <circle cx="120" cy="118" r="4" fill="currentColor" />
    <circle cx="143" cy="118" r="4" fill="currentColor" />
    <path
      d="M47 138h146"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      opacity=".35"
    />
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
