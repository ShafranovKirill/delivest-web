<script setup lang="ts">
import StarRewardBadge from '@/modules/account/components/StarRewardBadge.vue'

import ProductNutrition from '../ProductNutrition.vue'
import ProductImage from '../ProductImage.vue'
import ModifierPicker from '../ModifierPicker.vue'
import { useMenuStore } from '@/modules/menu/stores/menu.store.ts'
import { storeToRefs } from 'pinia'
import ResponsiveSheet from '@/modules/shared/components/ui/ResponsiveSheet.vue'
import AddToCartButton from '../button/AddToCartButton.vue'
import ProductTagPills from '../tags/ProductTagPills.vue'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'

const menuStore = useMenuStore()
const { t } = useI18n()
const { activeProduct } = storeToRefs(menuStore)

const weightKey = computed(() =>
  activeProduct.value?.measure_unit === 'ml' ? 'common.milliliters' : 'common.grams',
)
const groups = computed(() => activeProduct.value?.modifier_groups ?? [])
const selected = ref<string[]>([])
</script>

<template>
  <ResponsiveSheet
    v-model:visible="menuStore.isProductModalOpen"
    :aria-label="activeProduct?.name"
    sheet-class="h-auto!"
    :sheet-pt="{
      content: { class: 'min-h-0! overflow-y-auto! p-4! pt-2!' },
      footer: { class: 'border-t border-gray-100 bg-white/95 p-4! backdrop-blur-md' },
    }"
  >
    <div>
      <div class="w-full flex justify-center items-center shrink-0">
        <ProductImage
          :src="activeProduct?.photo_url"
          :alt="activeProduct?.name"
          class="aspect-square w-full max-w-50 rounded-4xl sm:max-w-64"
          :class="{ 'opacity-50 grayscale': activeProduct?.stopped }"
        />
      </div>

      <div class="mt-3 flex flex-col">
        <div class="flex flex-col gap-2">
          <ProductTagPills :tags="activeProduct?.tags ?? []" />
          <h2 class="text-2xl font-semibold tracking-tight text-gray-900">
            {{ activeProduct?.name }}
          </h2>

          <div
            v-if="activeProduct?.weight || activeProduct?.quantity"
            class="flex items-center gap-2 text-sm text-gray-500"
          >
            <span v-if="activeProduct?.weight">
              {{ t(weightKey, { value: activeProduct.weight }) }}
            </span>
            <span v-if="activeProduct?.weight && activeProduct?.quantity" aria-hidden="true"
              >·</span
            >
            <span v-if="activeProduct?.quantity">
              {{ t('common.pieces', { count: activeProduct.quantity }) }}
            </span>
          </div>

          <p
            v-if="activeProduct?.description"
            class="text-sm leading-relaxed text-gray-600 sm:text-base"
          >
            {{ activeProduct.description }}
          </p>
          <ProductNutrition :nutrition="activeProduct?.nutrition" />
          <StarRewardBadge :amount="activeProduct?.stars_reward" />
          <ModifierPicker
            v-if="groups.length && !activeProduct?.stopped"
            :key="activeProduct?.id"
            v-model="selected"
            :groups="groups"
            class="pt-2"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <AddToCartButton
        v-model="selected"
        :product="activeProduct"
        :show-modifiers="false"
        @added="menuStore.closeProductModal()"
      />
    </template>
  </ResponsiveSheet>
</template>
