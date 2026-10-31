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
    <span class="relative inline-flex">
      <Button
        icon="pi pi-user text-2xl!"
        variant="text"
        :class="{ 'text-primary!': signedIn }"
        :aria-label="signedIn ? t('auth.profile') : t('auth.signIn')"
        @click="open"
      />
      <span
        v-if="signedIn && loyalty.data.value?.enabled"
        class="pointer-events-none absolute -top-1 right-1/2 inline-flex items-center gap-0.5 whitespace-nowrap text-[10px] font-bold leading-none tabular-nums text-amber-600"
        :title="starsLabel(loyalty.data.value.balance)"
      >
        {{ loyalty.data.value.balance }}<i class="pi pi-star-fill text-[8px]!" aria-hidden="true" />
      </span>
    </span>
  </AccountMenu>
</template>
