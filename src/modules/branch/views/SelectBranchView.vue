<template>
  <div class="min-h-screen bg-gray-200 flex flex-col items-center justify-center px-4 py-10">
    <div
      translate="no"
      class="mb-6 text-4xl sm:text-5xl tracking-tighter text-primary select-none"
      style="font-family: 'Unbounded', sans-serif; font-weight: 500"
    >
      {{ franchiseStore.name }}
    </div>

    <div class="w-full max-w-md rounded-4xl bg-white p-5 sm:p-8 shadow-sm">
      <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-950">
        {{ t('branch.select.title') }}
      </h1>
      <p class="mt-1.5 text-sm text-gray-500">{{ t('branch.select.subtitle') }}</p>

      <div v-if="loading" class="flex justify-center py-12">
        <i class="pi pi-spin pi-spinner text-3xl text-primary" />
      </div>

      <div v-else class="mt-6 flex flex-col gap-2">
        <button
          v-for="branch in activeBranches"
          :key="branch.id"
          type="button"
          :disabled="selectingId === branch.id"
          class="group flex items-center gap-3 rounded-3xl bg-gray-50 border border-gray-100 p-3 text-left cursor-pointer hover:border-primary transition-colors disabled:opacity-60 disabled:cursor-wait"
          @click="handleSelect(branch)"
        >
          <span
            class="grid place-items-center size-11 shrink-0 rounded-2xl bg-white text-primary shadow-xs"
          >
            <i class="pi pi-map-marker text-lg" />
          </span>
          <span class="min-w-0 flex-1">
            <span
              class="block font-bold text-gray-900 truncate group-hover:text-primary transition-colors"
            >
              {{ branch.name }}
            </span>
            <span v-if="branch.branch_info?.address" class="block text-sm text-gray-500 truncate">
              {{ branch.branch_info.address }}
            </span>
          </span>
          <i
            :class="[
              'pi text-gray-400 group-hover:text-primary transition-colors',
              selectingId === branch.id ? 'pi-spin pi-spinner' : 'pi-chevron-right text-sm',
            ]"
          />
        </button>

        <p v-if="!activeBranches.length" class="py-8 text-center text-gray-500">
          {{ t('branch.select.empty') }}
        </p>
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
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const router = useRouter()
const toast = useToast()
const branchStore = useBranchStore()
const franchiseStore = useFranchiseStore()

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
        summary: t('common.error'),
        detail: t('branch.select.loadFailed'),
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
      summary: t('common.error'),
      detail: t('branch.select.selectFailed'),
      life: 3000,
    })
  } finally {
    selectingId.value = null
  }
}
</script>
