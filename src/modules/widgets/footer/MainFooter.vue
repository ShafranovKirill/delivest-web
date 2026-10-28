<script setup lang="ts">
import { computed } from 'vue'
import FooterBrand from './FooterBrand.vue'
import FooterLinks from './FooterLinks.vue'
import FooterLegal from './FooterLegal.vue'
import PoweredByDelivest from '../powered-by/PoweredByDelivest.vue'
import { useBranchNavigation } from '@/modules/branch/composables/useBranchNavigation'
import { useLegalLinks } from '@/modules/franchise/composables/useLegalLinks'
import { useI18n } from 'vue-i18n'

const navigateTo = useBranchNavigation()
const legalLinks = useLegalLinks()
const { t } = useI18n()

const customerLinks = computed(() => [
  { label: t('nav.menu'), action: () => navigateTo('menu') },
  { label: t('nav.promotions'), action: () => navigateTo('promotions') },
  { label: t('nav.about'), action: () => navigateTo('branch-info') },
  { label: t('nav.contacts'), action: () => navigateTo('contacts') },
])
</script>

<template>
  <footer class="w-full px-6 py-12">
    <div class="max-w-5xl mx-auto grid gap-10 sm:grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr]">
      <FooterBrand class="sm:col-span-2 md:col-span-1" />
      <FooterLinks :title="t('footer.customers')" :links="customerLinks" />
      <FooterLinks :title="t('footer.documents')" :links="legalLinks" />
    </div>

    <div class="max-w-5xl mx-auto mt-10 pt-6 border-t border-gray-300">
      <FooterLegal />
    </div>

    <div class="max-w-5xl mx-auto mt-6 flex justify-center">
      <PoweredByDelivest />
    </div>
  </footer>
</template>
