<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import type { Branch } from '@/modules/branch/api/branch.service'
import { useBranchStore } from '../stores/branch.store'
import SkeletonList from '@/modules/shared/components/ui/SkeletonList.vue'
import BranchSelectRow from './BranchSelectRow.vue'
import { useI18n } from 'vue-i18n'
import ResponsiveSheet from '@/modules/shared/components/ui/ResponsiveSheet.vue'

const { t } = useI18n()

const router = useRouter()
const toast = useToast()
const branchStore = useBranchStore()

const loading = ref(false)
const loadFailed = ref(false)
const selectingId = ref<string | null>(null)

function isSelected(branch: Branch) {
  return branchStore.activeBranch?.id === branch.id
}

async function load() {
  loading.value = true
  loadFailed.value = false

  try {
    await branchStore.refreshBranches()
  } catch {
    loadFailed.value = true
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

watch(
  () => branchStore.isModalOpen,
  (isOpen) => {
    if (isOpen) void load()
  },
)

async function handleSelect(branch: Branch) {
  if (isSelected(branch)) {
    branchStore.closeModal()
    return
  }

  if (selectingId.value) return
  selectingId.value = branch.id

  try {
    await branchStore.selectBranch(branch)
    branchStore.closeModal()
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

<template>
  <ResponsiveSheet
    v-model:visible="branchStore.isModalOpen"
    :close-on-escape="true"
    :aria-label="t('branch.select.title')"
    desktop-class="w-[90vw] max-w-lg"
  >
    <template #header>
      <h2 class="text-xl font-extrabold text-gray-950">{{ t('branch.select.title') }}</h2>
    </template>
    <div class="max-h-[70vh] overflow-y-auto pt-1">
      <SkeletonList v-if="loading" class="flex flex-col gap-2.5" item-class="h-31 rounded-3xl!" />

      <div v-else-if="branchStore.branches.length" class="flex flex-col gap-2.5">
        <BranchSelectRow
          v-for="branch in branchStore.branches.filter((item) => item.is_active)"
          :key="branch.id"
          :branch="branch"
          :selected="isSelected(branch)"
          :selecting="selectingId === branch.id"
          @select="handleSelect(branch)"
        />
      </div>

      <div v-else class="py-6 text-center">
        <p class="text-sm text-gray-500">{{ t('branch.select.empty') }}</p>
        <Button
          :label="t('branch.select.retry')"
          class="mt-4 rounded-full! font-semibold"
          @click="load"
        />
      </div>

      <p v-if="loadFailed" class="mt-3 text-center text-sm text-red-500">
        {{ t('branch.select.loadFailed') }}
        <button
          type="button"
          class="ml-1 cursor-pointer font-semibold underline underline-offset-2"
          @click="load"
        >
          {{ t('branch.select.retry') }}
        </button>
      </p>
    </div>
  </ResponsiveSheet>
</template>
