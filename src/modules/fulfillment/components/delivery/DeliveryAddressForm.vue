<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

const editing = ref(!address.value.house)
const extraOpen = ref(false)
const hasHouse = computed(() =>
  Boolean(address.value.street?.trim() && address.value.house?.trim()),
)
const compact = computed(() => hasHouse.value && !editing.value)
watch(
  () => address.value.latitude,
  (value) => {
    if (value && hasHouse.value) editing.value = false
  },
)
const details = ['entrance', 'intercom', 'floor'] as const
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-if="compact"
      class="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2"
    >
      <span class="min-w-0 truncate text-sm font-medium">{{ streetLine(address) }}</span>
      <button
        type="button"
        class="shrink-0 text-sm font-medium text-primary"
        @click="editing = true"
      >
        {{ t('common.edit') }}
      </button>
    </div>
    <AddressSuggestInput
      v-if="!compact && suggest"
      :value="streetLine(address)"
      :city="city"
      :placeholder="t('fulfillment.form.streetAndHouse')"
      @select="$emit('select', $event)"
      @edit="clearHouse"
    />
    <div v-else-if="!compact" class="grid grid-cols-3 gap-2">
      <InputText
        v-model="address.street"
        :placeholder="t('address.street')"
        class="col-span-2 w-full"
      />
      <InputText v-model="address.house" :placeholder="t('address.house')" class="w-full" />
    </div>

    <button
      v-if="hasHouse && editing"
      type="button"
      class="self-end text-sm font-medium text-primary"
      @click="editing = false"
    >
      {{ t('common.save') }}
    </button>
    <template v-if="hasHouse">
      <InputText
        v-model="address.apartment"
        :placeholder="t('fulfillment.form.apartment')"
        :aria-label="t('fulfillment.form.apartment')"
        class="w-full"
      />
      <details :open="extraOpen" @toggle="extraOpen = ($event.target as HTMLDetailsElement).open">
        <summary class="cursor-pointer py-2 text-sm text-gray-500">
          {{ t('fulfillment.form.extraDetails') }}
        </summary>
        <div class="grid grid-cols-3 gap-2 pt-2">
          <InputText
            v-for="field in details"
            :key="field"
            v-model="address[field]"
            :placeholder="t(`fulfillment.form.${field}`)"
            :aria-label="t(`fulfillment.form.${field}`)"
            class="w-full min-w-0"
          />
        </div>
        <InputText
          v-model="address.comment"
          :placeholder="t('fulfillment.form.comment')"
          :aria-label="t('fulfillment.form.comment')"
          class="mt-2 w-full"
        />
      </details>
    </template>
  </div>
</template>
