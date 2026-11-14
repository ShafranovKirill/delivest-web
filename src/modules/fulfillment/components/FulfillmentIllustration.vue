<script setup lang="ts">
defineProps<{ kind: 'delivery' | 'pickup' }>()
</script>

<template>
  <svg
    v-if="kind === 'delivery'"
    viewBox="0 0 220 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    focusable="false"
  >
    <g fill="currentColor" opacity=".23">
      <path d="M5 29h36v53H5zM12 23h22v6H12zM42 43l20-10 21 10v39H42zM181 46h32v36h-32z" />
    </g>
    <g fill="var(--summary-bg)" opacity=".8">
      <path
        d="M13 38h5v9h-5zM27 38h5v9h-5zM13 55h5v9h-5zM27 55h5v9h-5zM52 51h5v9h-5zM67 51h5v9h-5zM188 54h5v9h-5zM201 54h5v9h-5z"
      />
    </g>
    <path
      d="M67 80c0-9 6-15 15-17l19-5 17-17c4-4 9-6 15-6h37c12 0 19 6 22 17l6 27c1 4-1 6-5 6H69c-2 0-3-2-2-5Z"
      fill="currentColor"
    />
    <path
      d="m116 57 13-14c2-2 4-3 7-3h11v18h-31ZM153 40h14c8 0 13 4 16 13l2 5h-32V40Z"
      fill="var(--summary-bg)"
    />
    <path
      d="M161 57v-8a6 6 0 0 1 12 0v8m-15-5h18v12h-18z"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linejoin="round"
    />
    <circle cx="91" cy="84" r="11" fill="currentColor" />
    <circle cx="172" cy="84" r="11" fill="currentColor" />
    <circle cx="91" cy="84" r="6" fill="var(--summary-bg)" />
    <circle cx="172" cy="84" r="6" fill="var(--summary-bg)" />
    <path
      d="M4 91h36m15 0h27m110 0h24"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      opacity=".45"
    />
  </svg>
  <svg
    v-else
    viewBox="0 0 220 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    focusable="false"
  >
    <path d="M28 34h164v57H28z" fill="var(--summary-bg)" stroke="currentColor" stroke-width="2.5" />
    <path d="M22 33 38 9h144l16 24H22Z" fill="currentColor" />
    <path
      d="m43 9-9 24h20l8-24H43Zm39 0-4 24h20l3-24H82Zm39 0 3 24h20l-4-24h-19Zm38 0 8 24h20L178 9h-19Z"
      fill="var(--summary-bg)"
    />
    <path
      d="M22 33c0 10 16 10 16 0 0 10 16 10 16 0 0 10 16 10 16 0 0 10 16 10 16 0 0 10 16 10 16 0 0 10 16 10 16 0 0 10 16 10 16 0 0 10 16 10 16 0 0 10 16 10 16 0 0 10 16 10 16 0 0 10 16 10 16 0"
      stroke="currentColor"
      stroke-width="2"
    />
    <path d="M48 91V47h39v44m7 0V51h25v40" stroke="currentColor" stroke-width="3" />
    <path d="M97 54h19v19H97z" fill="currentColor" />
    <path d="M128 49h46v27h-46zM126 78h50" stroke="currentColor" stroke-width="2.5" />
    <path
      d="m140 68 11-11m2 13 11-11"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="m87 91 5-19h15l5 19H87Z"
      fill="var(--summary-bg)"
      stroke="currentColor"
      stroke-width="2.5"
    />
    <path d="M95 74v-4a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2.5" />
    <path d="M9 92h202" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
</template>
