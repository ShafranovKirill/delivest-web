<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import type { ActiveOrder } from '../../api/order.service'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  courier: NonNullable<ActiveOrder['courier']>
  status: ActiveOrder['status']
}>()

const { t } = useI18n()

const label = computed(() =>
  props.status === 'delivering' ? t('order.courier.onTheWay') : t('order.courier.coming'),
)
</script>

<template>
  <SurfaceCard icon="pi-car" :label="label">
    <template #value>{{ courier.name || t('order.courier.title') }}</template>
    <template #aside>
      <div class="flex gap-2">
        <Button
          v-if="courier.tracking_url"
          as="a"
          :href="courier.tracking_url"
          target="_blank"
          rel="noopener"
          icon="pi pi-map"
          :aria-label="t('order.courier.track')"
          severity="secondary"
          rounded
        />
        <Button
          v-if="courier.phone"
          as="a"
          :href="`tel:${courier.phone}`"
          icon="pi pi-phone"
          :aria-label="t('order.courier.call')"
          rounded
        />
      </div>
    </template>
  </SurfaceCard>
</template>
