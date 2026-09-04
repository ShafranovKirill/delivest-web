<template>
  <div
    class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12"
  >
    <div class="w-full max-w-md space-y-8 text-center">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">Выберите филиал</h1>
        <p class="text-sm text-slate-400">Укажите удобный филиал для оформления заказа</p>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-12">
        <div
          class="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"
        ></div>
      </div>

      <div v-else class="space-y-3">
        <button
          v-for="branch in activeBranches"
          :key="branch.id"
          type="button"
          :disabled="selectingId === branch.id"
          @click="handleSelect(branch)"
          class="w-full group relative flex items-center justify-between p-4 text-left rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/60 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span
            class="text-base font-medium text-slate-200 group-hover:text-white transition-colors"
          >
            {{ branch.name }}
          </span>

          <div
            class="flex items-center space-x-2 text-slate-500 group-hover:text-emerald-400 transition-colors"
          >
            <div
              v-if="selectingId === branch.id"
              class="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"
            ></div>
            <svg
              v-else
              class="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
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
