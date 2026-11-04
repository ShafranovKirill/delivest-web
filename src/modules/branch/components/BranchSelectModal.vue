<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import type { Branch } from '@/modules/branch/api/branch.service'
import { useBranchStore } from '../stores/branch.store'
import SkeletonList from '@/modules/shared/components/ui/SkeletonList.vue'
import BranchSelectRow from './BranchSelectRow.vue'
import { useI18n } from 'vue-i18n'

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
  <Dialog
    v-model:visible="branchStore.isModalOpen"
    :dismissable-mask="true"
    :close-on-escape="true"
    modal
    :header="t('branch.select.title')"
    class="w-[90vw] max-w-lg"
  >
    <div class="max-h-[70vh] overflow-y-auto pt-1">
      <SkeletonList v-if="loading" class="flex flex-col gap-2" item-class="h-14 rounded-2xl!" />

      <div v-else-if="branchStore.branches.length" class="flex flex-col gap-2">
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
  </Dialog>
</template>
