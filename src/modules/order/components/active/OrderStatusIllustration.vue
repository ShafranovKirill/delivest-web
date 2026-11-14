<script setup lang="ts">
import type { OrderStatus } from '../../api/order.service'

defineProps<{ status: OrderStatus; awaitingPayment?: boolean }>()
</script>

<template>
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
    <g
      v-if="
        awaitingPayment || status === 'created' || status === 'accepted' || status === 'cancelled'
      "
      :opacity="status === 'cancelled' ? 0.55 : 1"
    >
      <path d="M35 93h90l-4-13H39l-4 13Z" fill="currentColor" opacity=".9" />
      <path
        d="M49 80V15l13 3 12-3 12 3 12-3 12 3v62"
        stroke="currentColor"
        stroke-width="3"
        stroke-linejoin="round"
      />
      <path
        d="M62 36h37M62 48h30M62 60h23"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
      <path
        v-if="awaitingPayment"
        d="M88 65h41v28H88z"
        fill="var(--color-primary-soft)"
        stroke="currentColor"
        stroke-width="3"
      />
      <path
        v-if="awaitingPayment"
        d="M91 73h35m-28 12h12"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
      <path
        v-if="status === 'accepted' && !awaitingPayment"
        d="m89 69 9 9 18-21"
        stroke="currentColor"
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        v-if="status === 'cancelled' && !awaitingPayment"
        d="m90 62 20 20m0-20L90 82"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
      />
    </g>
    <g v-else-if="status === 'preparing'">
      <path d="M32 64h85v30c0 8-9 13-42 13S32 102 32 94V64Z" fill="currentColor" opacity=".9" />
      <ellipse
        cx="74"
        cy="64"
        rx="42"
        ry="10"
        fill="var(--color-primary-soft)"
        stroke="currentColor"
        stroke-width="3"
      />
      <path
        d="M36 44c9-18 70-22 80 0 2 4-7 9-34 8-26-1-48-5-46-8Z"
        fill="var(--color-primary-soft)"
        stroke="currentColor"
        stroke-width="3"
      />
      <path
        d="M68 27c0-8 15-8 15 0"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
      />
      <path
        d="M118 73c17-9 27-10 31-6 4 6-8 11-31 19"
        stroke="currentColor"
        stroke-width="7"
        stroke-linecap="round"
      />
      <path
        d="M21 35c-6-7 5-10 0-18m12 16c-4-6 4-10 1-17"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </g>
    <g v-else-if="status === 'ready' || status === 'completed'">
      <path
        d="M32 100 43 41h75l11 59H32Z"
        fill="var(--color-primary-soft)"
        stroke="currentColor"
        stroke-width="3"
        stroke-linejoin="round"
      />
      <path
        d="M43 41h75l-8 59H32l11-59Z"
        fill="var(--color-primary-soft)"
        stroke="currentColor"
        stroke-width="3"
      />
      <path
        d="M59 52V35c0-22 22-22 22 0v17m4 0V35c0-22 22-22 22 0v17"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
      />
      <path d="M20 102h120" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      <path
        v-if="status === 'completed'"
        d="m73 77 9 9 19-21"
        stroke="currentColor"
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
    <g v-else-if="status === 'delivering'">
      <path
        d="M16 89c0-9 6-15 15-17l19-5 17-17c4-4 9-6 15-6h37c12 0 19 6 22 17l6 27c1 4-1 6-5 6H18c-2 0-3-2-2-5Z"
        fill="currentColor"
      />
      <path
        d="m65 66 13-14c2-2 4-3 7-3h11v18H65Zm37-17h14c8 0 13 4 16 13l2 5h-32V49Z"
        fill="var(--color-primary-soft)"
      />
      <path
        d="M112 66v-8a6 6 0 0 1 12 0v8m-15-5h18v12h-18z"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linejoin="round"
      />
      <circle cx="41" cy="93" r="11" fill="currentColor" />
      <circle cx="121" cy="93" r="11" fill="currentColor" />
      <circle cx="41" cy="93" r="5" fill="var(--color-primary-soft)" />
      <circle cx="121" cy="93" r="5" fill="var(--color-primary-soft)" />
    </g>
  </svg>
</template>
