<template>
  <div
    class="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-center items-center px-4 py-12"
  >
    <div class="w-full max-w-md space-y-8 text-center">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Выберите филиал</h1>
        <p class="text-sm text-gray-500">Укажите удобный филиал для оформления заказа</p>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-12">
        <i class="pi pi-spin pi-spinner text-3xl text-(--p-primary-500)"></i>
      </div>

      <div v-else class="space-y-3">
        <button
          v-for="branch in activeBranches"
          :key="branch.id"
          type="button"
          :disabled="selectingId === branch.id"
          @click="handleSelect(branch)"
          class="w-full group relative flex items-center justify-between p-4 text-left rounded-2xl bg-white border border-gray-200 hover:border-(--p-primary-500) transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs hover:shadow-md"
        >
          <div class="flex items-center space-x-2.5 min-w-0 pr-3">
            <i
              class="pi pi-map-marker text-gray-400 group-hover:text-(--p-primary-500) transition-colors"
            ></i>
            <span
              class="text-base font-medium text-gray-800 group-hover:text-(--p-primary-500) transition-colors truncate"
            >
              {{ branch.name }}
            </span>
          </div>

          <div
            class="flex items-center text-gray-400 group-hover:text-(--p-primary-500) transition-colors shrink-0"
          >
            <i v-if="selectingId === branch.id" class="pi pi-spin pi-spinner text-lg"></i>
            <i
              v-else
              class="pi pi-chevron-right text-sm transform group-hover:translate-x-0.5 transition-transform"
            ></i>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import type { Branch } from '@/modules/branch/api/branch.service'
import { useBranchStore } from '../stores/branch.store'

const router = useRouter()
const toast = useToast()
const branchStore = useBranchStore()

const loading = ref(false)
const selectingId = ref<string | null>(null)

const activeBranches = computed(() => {
  return branchStore.branches.filter((b) => b.is_active)
})

onMounted(async () => {
  if (!branchStore.isInitialized) {
    loading.value = true
    try {
      await branchStore.initBranches()
    } catch {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось загрузить список филиалов',
        life: 3000,
      })
    } finally {
      loading.value = false
    }
  }
})

async function handleSelect(branch: Branch) {
  selectingId.value = branch.id

  try {
    await branchStore.selectBranch(branch)
    router.push(`/${branch.slug}`)
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Ошибка при выборе филиала. Попробуйте еще раз.',
      life: 3000,
    })
  } finally {
    selectingId.value = null
  }
}
</script>
