<script setup lang="ts">
import StarRewardBadge from '@/modules/account/components/StarRewardBadge.vue'

import ProductNutrition from '../ProductNutrition.vue'
import ProductImage from '../ProductImage.vue'
import ModifierPicker from '../ModifierPicker.vue'
import { useMenuStore } from '@/modules/menu/stores/menu.store.ts'
import { storeToRefs } from 'pinia'
import Drawer from 'primevue/drawer'
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
  <Drawer
    v-model:visible="menuStore.isProductModalOpen"
    position="bottom"
    block-scroll
    role="dialog"
    :aria-label="activeProduct?.name"
    class="h-dvh!"
  >
    <template #container>
      <button
        type="button"
        :aria-label="t('common.close')"
        @click="menuStore.closeProductModal()"
        class="absolute top-4 left-4 z-10 flex size-10 items-center justify-center rounded-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-200"
      >
        <i class="pi pi-angle-down text-2xl! font-extralight!" />
      </button>

      <div class="flex h-full flex-col">
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pt-14">
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
        <div class="shrink-0 border-t border-gray-100 bg-white/95 p-4 backdrop-blur-md">
          <AddToCartButton
            v-model="selected"
            :product="activeProduct"
            :show-modifiers="false"
            @added="menuStore.closeProductModal()"
          />
        </div>
      </div>
    </template>
  </Drawer>
</template>
