<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

function isSelected(branch: Branch) {
  return branchStore.activeBranch?.id === branch.id
}

watch(
  () => branchStore.isModalOpen,
  async (isOpen) => {
    if (isOpen && !branchStore.isInitialized) {
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
  },
)

async function handleSelect(branch: Branch) {
  if (isSelected(branch)) {
    branchStore.closeModal()
    return
  }

  selectingId.value = branch.id

  try {
    await branchStore.selectBranch(branch)
    branchStore.closeModal()
    router.push(`/${branch.slug}`)
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось сменить филиал. Попробуйте еще раз.',
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
    modal
    header="Выберите филиал"
    class="w-[90vw] max-w-lg"
  >
    <div class="space-y-2 pt-2">
      <div v-if="loading" class="flex justify-center items-center py-8">
        <i class="pi pi-spin pi-spinner text-2xl text-(--p-primary-500)"></i>
      </div>

      <template v-else-if="activeBranches.length > 0">
        <button
          v-for="branch in activeBranches"
          :key="branch.id"
          type="button"
          :disabled="selectingId === branch.id"
          @click="handleSelect(branch)"
          class="w-full text-left p-3.5 rounded-xl border border-gray-200 hover:border-(--p-primary-500) transition-all flex items-center justify-between group disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          :class="{
            'border-(--p-primary-500) bg-(--p-primary-50)/20 font-semibold': isSelected(branch),
          }"
        >
          <div class="flex items-center space-x-2 min-w-0 pr-3">
            <i
              class="pi pi-map-marker shrink-0 transition-colors"
              :class="
                isSelected(branch)
                  ? 'text-[var(--p-primary-500)]'
                  : 'text-gray-400 group-hover:text-[var(--p-primary-500)]'
              "
            ></i>

            <span class="text-sm truncate shrink-0">
              {{ branch.name }}
            </span>
          </div>

          <div class="shrink-0 flex items-center">
            <i
              v-if="selectingId === branch.id"
              class="pi pi-spin pi-spinner text-sm text-(--p-primary-500)"
            ></i>
            <i
              v-else-if="isSelected(branch)"
              class="pi pi-check text-sm text-(--p-primary-500)"
            ></i>
          </div>
        </button>
      </template>

      <div v-else class="text-center py-6 text-gray-500 text-sm">Список филиалов пуст</div>
    </div>
  </Dialog>
</template>
