<script setup lang="ts">
import { computed } from 'vue'
import { useLegalLinks } from '@/modules/franchise/composables/useLegalLinks'
import { useI18n } from 'vue-i18n'

const legalLinks = useLegalLinks()
const { t } = useI18n()

const links = computed(() =>
  Object.fromEntries(legalLinks.value.map((link) => [link.kind, link.to])),
)
</script>

<template>
  <i18n-t
    keypath="order.form.consent"
    tag="p"
    scope="global"
    class="text-xs text-center text-gray-500"
  >
    <template #offer>
      <RouterLink :to="links.offer!" target="_blank" class="underline hover:text-primary">
        {{ t('order.form.consentOffer') }}
      </RouterLink>
    </template>
    <template #consent>
      <RouterLink :to="links.consent!" target="_blank" class="underline hover:text-primary">
        {{ t('order.form.consentData') }}
      </RouterLink>
    </template>
  </i18n-t>
</template>
