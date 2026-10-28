<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <a
    href="https://delivest.shafranov.tech"
    target="_blank"
    rel="noopener"
    class="group inline-flex items-center gap-2 rounded-full border border-gray-300 py-1 pl-1 pr-3 text-xs text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
  >
    <svg viewBox="0 0 512 512" class="size-5 shrink-0 rounded-full" aria-hidden="true">
      <rect width="512" height="512" fill="#48010c" />
      <g transform="translate(60.64 66.56) scale(0.74)">
        <path
          d="M96 108 A28 28 0 0 1 124 80 H264 C360 80 432 160 432 256 C432 352 360 432 264 432 H124 A28 28 0 0 1 96 404 Z M244.2 364.9 C216.4 325.1 172 291.8 172 234 A80 80 0 1 1 332 234 C332 291.8 287.6 325.1 259.8 364.9 Q252 373.4 244.2 364.9 Z"
          fill="#fff"
          fill-rule="evenodd"
        />
        <circle cx="252" cy="234" r="29" fill="#fff" />
      </g>
    </svg>
    <span>
      {{ t('poweredBy.prefix') }}
      <span class="font-semibold text-gray-700 group-hover:text-primary">Delivest</span>
    </span>
  </a>
</template>
