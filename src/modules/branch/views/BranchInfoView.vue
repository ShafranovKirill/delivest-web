<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import type { Branch } from '../api/branch.service'
import type { Ref } from 'vue'

const branchStore = useBranchStore()
const { activeBranch } = storeToRefs(branchStore) as { activeBranch: Ref<Branch | null> }
const handleChangeBranch = () => {
  branchStore.openModal()
}
</script>

<template>
  <div class="bg-gray-200 w-full min-h-screen">
    <div class="bg-white rounded-4xl w-full min-h-screen py-8 px-4 sm:px-6">
      <div class="max-w-4xl mx-auto">
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-100 mb-8"
        >
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Информация о филиале
            </h1>
            <p class="text-sm text-gray-500 mt-1">
              Контакты, адрес и режим работы выбранного заведения
            </p>
          </div>

          <button
            @click="handleChangeBranch"
            class="inline-flex items-center gap-2 self-start sm:self-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all duration-200 cursor-pointer group shadow-sm"
          >
            <i
              class="pi pi-map-marker text-lg text-gray-700 group-hover:text-(--p-primary-500) transition-colors"
            ></i>
            <div class="flex flex-col items-start text-left">
              <span class="text-xs text-gray-400 font-medium leading-none">Текущий филиал</span>
              <span
                class="text-sm font-bold text-gray-900 group-hover:text-(--p-primary-500) transition-colors mt-0.5"
              >
                {{ activeBranch?.name || 'Не выбран' }}
              </span>
            </div>
            <i
              class="pi pi-chevron-right text-xs text-gray-400 group-hover:text-(--p-primary-500) ml-1 transition-colors"
            ></i>
          </button>
        </div>

        <div v-if="activeBranch" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-4">
              <div class="p-3 bg-white rounded-xl shadow-xs text-(--p-primary-500)">
                <i class="pi pi-building text-xl"></i>
              </div>
              <div>
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >Адрес</span
                >
                <p class="text-base font-semibold text-gray-900 mt-1">
                  {{ activeBranch.branch_info?.address || 'Адрес не указан' }}
                </p>
              </div>
            </div>

            <div class="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-4">
              <div class="p-3 bg-white rounded-xl shadow-xs text-(--p-primary-500)">
                <i class="pi pi-clock text-xl"></i>
              </div>
              <div>
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >Среднее время доставки</span
                >
                <p class="text-base font-semibold text-gray-900 mt-1">
                  <template v-if="activeBranch.branch_info?.delivery_time">
                    ~ {{ activeBranch.branch_info.delivery_time }} мин.
                  </template>
                  <template v-else> Не указано </template>
                </p>
              </div>
            </div>

            <div class="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-4">
              <div class="p-3 bg-white rounded-xl shadow-xs text-(--p-primary-500)">
                <i class="pi pi-phone text-xl"></i>
              </div>
              <div>
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >Телефон для связи</span
                >
                <p class="text-base font-semibold text-gray-900 mt-1">
                  <a
                    v-if="activeBranch.branch_info?.phone_number"
                    :href="`tel:${activeBranch.branch_info.phone_number}`"
                    class="hover:underline hover:text-(--p-primary-500) transition-colors"
                  >
                    {{ activeBranch.branch_info.phone_number }}
                  </a>
                  <span v-else>Не указан</span>
                </p>
              </div>
            </div>

            <div class="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-4">
              <div class="p-3 bg-white rounded-xl shadow-xs text-(--p-primary-500)">
                <i class="pi pi-info-circle text-xl"></i>
              </div>
              <div>
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >Статус филиала</span
                >
                <div class="mt-1 flex items-center gap-2">
                  <span
                    class="w-2.5 h-2.5 rounded-full"
                    :class="activeBranch.is_active ? 'bg-green-500' : 'bg-red-500'"
                  ></span>
                  <span class="text-base font-semibold text-gray-900">
                    {{
                      activeBranch.is_active ? 'Открыто / Принимает заказы' : 'Временно не работает'
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="
              activeBranch.branch_info?.vk_url ||
              activeBranch.branch_info?.instagram_url ||
              activeBranch.branch_info?.whatsapp_url
            "
            class="p-6 rounded-2xl bg-gray-50 border border-gray-100"
          >
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Мы в социальных сетях
            </h3>

            <div class="flex flex-wrap gap-3">
              <a
                v-if="activeBranch.branch_info?.vk_url"
                :href="activeBranch.branch_info.vk_url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-gray-700 font-medium hover:border-(--p-primary-500) hover:text-(--p-primary-500) transition-all shadow-xs"
              >
                <i-vk-logo-black class="w-4 h-4" /> <span>ВКонтакте</span>
              </a>

              <a
                v-if="activeBranch.branch_info?.instagram_url"
                :href="activeBranch.branch_info.instagram_url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-gray-700 font-medium hover:border-(--p-primary-500) hover:text-(--p-primary-500) transition-all shadow-xs"
              >
                <i class="pi pi-instagram text-lg"></i>
                <span>Instagram</span>
              </a>

              <a
                v-if="activeBranch.branch_info?.whatsapp_url"
                :href="activeBranch.branch_info.whatsapp_url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-gray-700 font-medium hover:border-(--p-primary-500) hover:text-(--p-primary-500) transition-all shadow-xs"
              >
                <i class="pi pi-whatsapp text-lg"></i>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <i class="pi pi-map-marker text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-500 font-medium mb-4">Филиал не выбран</p>
          <button
            @click="handleChangeBranch"
            class="px-5 py-2.5 bg-(--p-primary-500) text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Выбрать филиал
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
