<script setup lang="ts">
import InputText from 'primevue/inputtext'
import { useI18n } from 'vue-i18n'
import AddressSuggestInput from './AddressSuggestInput.vue'
import { streetLine, withoutGeo, type DeliveryAddress } from '../../utils/deliveryAddress'
import type { GeoAddress } from '../../api/geo.service'

defineProps<{ suggest: boolean; city: string | null }>()
defineEmits<{ select: [address: GeoAddress] }>()

const address = defineModel<DeliveryAddress>({ required: true })
const { t } = useI18n()

function clearHouse() {
  address.value = withoutGeo(address.value)
}

const details = ['entrance', 'intercom', 'floor', 'apartment'] as const
</script>

<template>
  <div class="flex flex-col gap-2">
    <AddressSuggestInput
      v-if="suggest"
      :value="streetLine(address)"
      :city="city"
      :placeholder="t('fulfillment.form.streetAndHouse')"
      @select="$emit('select', $event)"
      @edit="clearHouse"
    />
    <div v-else class="grid grid-cols-3 gap-2">
      <InputText
        v-model="address.street"
        :placeholder="t('address.street')"
        class="col-span-2 w-full"
      />
      <InputText v-model="address.house" :placeholder="t('address.house')" class="w-full" />
    </div>

    <div class="grid grid-cols-2 gap-2">
      <InputText
        v-for="field in details"
        :key="field"
        v-model="address[field]"
        :placeholder="t(`fulfillment.form.${field}`)"
        class="w-full"
      />
    </div>

    <InputText
      v-model="address.comment"
      :placeholder="t('fulfillment.form.comment')"
      class="w-full"
    />
  </div>
</template>
