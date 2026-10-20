<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCartStore } from '../stores/cart.store'
import { getApiErrorMessage } from '@/api/errors'
import { reasonsText, rejectedText } from '../utils/promoText'

const cartStore = useCartStore()

const code = ref('')
const error = ref<string | null>(null)
const isPending = ref(false)

const state = computed(() => cartStore.promoCode)

const statusText = computed(() => {
  const current = state.value
  if (!current) return null
  if (current.status === 'applied') return current.name ?? 'Промокод применён'
  if (current.status === 'pending')
    return `Чтобы промокод сработал: ${reasonsText(current.reasons)}`
  return rejectedText(current)
})

async function apply() {
  const value = code.value.trim()
  if (!value || isPending.value) return

  isPending.value = true
  error.value = null
  try {
    await cartStore.applyPromoCode(value)
    code.value = ''
  } catch (e) {
    error.value = getApiErrorMessage(e)
  } finally {
    isPending.value = false
  }
}

async function remove() {
  if (isPending.value) return

  isPending.value = true
  try {
    await cartStore.removePromoCode()
  } catch (e) {
    error.value = getApiErrorMessage(e)
  } finally {
    isPending.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-if="state"
      class="flex items-start gap-3 rounded-2xl border p-3 text-sm"
      :class="{
        'border-green-200 bg-green-50 text-green-800': state.status === 'applied',
        'border-amber-200 bg-amber-50 text-amber-800': state.status === 'pending',
        'border-red-200 bg-red-50 text-red-700': state.status === 'rejected',
      }"
    >
      <i class="pi pi-ticket mt-0.5" />
      <span class="min-w-0 flex-1">
        <span class="block font-mono font-semibold">{{ state.code }}</span>
        <span class="block text-xs">{{ statusText }}</span>
      </span>
      <button
        type="button"
        class="shrink-0 rounded-lg p-1 opacity-70 transition-opacity hover:opacity-100"
        title="Убрать промокод"
        :disabled="isPending"
        @click="remove"
      >
        <i class="pi pi-times" />
      </button>
    </div>

    <form v-else class="flex gap-2" @submit.prevent="apply">
      <input
        v-model="code"
        type="text"
        maxlength="32"
        autocomplete="off"
        placeholder="Промокод"
        class="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-mono text-sm uppercase outline-none transition-colors focus:border-(--p-primary-500)"
      />
      <button
        type="submit"
        :disabled="!code.trim() || isPending"
        class="shrink-0 rounded-xl bg-(--p-primary-500) px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <i v-if="isPending" class="pi pi-spin pi-spinner" />
        <span v-else>Применить</span>
      </button>
    </form>

    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>
