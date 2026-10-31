<script setup lang="ts">
import Button from 'primevue/button'
import { useLoyaltyQuery } from '@/modules/account/composables/useLoyaltyQuery'
import { useStarsLabel } from '@/modules/account/composables/useStarsLabel'
import AccountMenu from './AccountMenu.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const loyalty = useLoyaltyQuery()
const starsLabel = useStarsLabel()
</script>

<template>
  <AccountMenu v-slot="{ open, signedIn }">
    <Button
      variant="text"
      :class="{ 'text-primary!': signedIn }"
      :aria-label="signedIn ? t('auth.profile') : t('auth.signIn')"
      @click="open"
    >
      <span
        class="relative grid size-9 place-items-center rounded-full"
        :class="signedIn ? 'bg-primary-soft text-primary' : ''"
      >
        <i class="pi pi-user text-xl" aria-hidden="true" />
      </span>
      <span
        v-if="signedIn && loyalty.data.value?.enabled"
        class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-sm font-bold tabular-nums text-amber-700"
        :title="starsLabel(loyalty.data.value.balance)"
      >
        <i class="pi pi-star-fill text-xs" aria-hidden="true" />{{ loyalty.data.value.balance }}
      </span>
    </Button>
  </AccountMenu>
</template>
