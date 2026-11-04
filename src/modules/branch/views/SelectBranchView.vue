<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-200 px-4 py-10">
    <BrandLogo class="mb-6 h-10 max-w-64 text-4xl text-gray-950 sm:h-12 sm:text-5xl" />

    <div class="w-full max-w-md sm:max-w-lg">
      <h1 class="text-center text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
        {{ t('branch.select.title') }}
      </h1>

      <SkeletonList
        v-if="loading"
        class="mt-6 flex flex-col gap-2"
        item-class="h-16 rounded-2xl!"
      />

      <template v-else>
        <div v-if="branches.length" class="mt-6 flex flex-col gap-2">
          <BranchSelectRow
            v-for="branch in branches"
            :key="branch.id"
            :branch="branch"
            :selecting="selectingId === branch.id"
            @select="handleSelect(branch)"
          />
        </div>

        <div v-else class="mt-6 rounded-2xl border border-gray-100 bg-white px-4 py-8 text-center">
          <p class="text-gray-500">{{ t('branch.select.empty') }}</p>
          <Button
            :label="t('branch.select.retry')"
            class="mt-4 rounded-full! font-semibold"
            @click="load"
          />
        </div>

        <p v-if="loadFailed && branches.length" class="mt-4 text-center text-sm text-red-500">
          {{ t('branch.select.loadFailed') }}
          <button
            type="button"
            class="ml-1 cursor-pointer font-semibold underline underline-offset-2"
            @click="load"
          >
            {{ t('branch.select.retry') }}
          </button>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import type { Branch } from '@/modules/branch/api/branch.service'
import { useBranchStore } from '../stores/branch.store'
import SkeletonList from '@/modules/shared/components/ui/SkeletonList.vue'
import BrandLogo from '@/modules/franchise/components/BrandLogo.vue'
import BranchSelectRow from '../components/BranchSelectRow.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const router = useRouter()
const toast = useToast()
const branchStore = useBranchStore()

const loading = ref(false)
const loadFailed = ref(false)
const selectingId = ref<string | null>(null)

/** Active branches stay selectable even when their schedule is closed. */
const branches = ref<Branch[]>([])

async function load() {
  loading.value = true
  loadFailed.value = false

  try {
    await branchStore.refreshBranches()
    branches.value = branchStore.branches.filter((b) => b.is_active)
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

onMounted(load)

async function handleSelect(branch: Branch) {
  if (selectingId.value) return
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
