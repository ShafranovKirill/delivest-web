<script setup lang="ts">
import Toast from 'primevue/toast'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'

const viewportStore = useViewportStore()

const SEVERITY: Record<string, { icon: string; badge: string; bar: string }> = {
  success: { icon: 'pi-check', badge: 'bg-green-100 text-green-700', bar: 'bg-green-500' },
  info: { icon: 'pi-info', badge: 'bg-primary-soft text-primary', bar: 'bg-primary-fill' },
  warn: {
    icon: 'pi-exclamation-triangle',
    badge: 'bg-amber-50 text-amber-800',
    bar: 'bg-amber-400',
  },
  error: { icon: 'pi-times', badge: 'bg-red-50 text-red-600', bar: 'bg-red-500' },
}

function look(severity?: string) {
  return SEVERITY[severity ?? 'info'] ?? SEVERITY.info!
}
</script>

<template>
  <Toast
    :position="viewportStore.isMobile ? 'top-center' : 'top-right'"
    :pt="{
      root: {
        class: viewportStore.isMobile ? 'w-[calc(100vw-1.5rem)]! top-3!' : 'w-96! top-4! right-4!',
      },
      message: { class: 'bg-transparent! border-0! shadow-none! p-0! mb-2! backdrop-blur-none!' },
    }"
  >
    <template #container="{ message, closeCallback }">
      <div
        class="relative flex items-start gap-3 overflow-hidden rounded-3xl bg-white p-4 pr-11 shadow-xl ring-1 ring-black/5"
        role="status"
      >
        <span
          class="grid place-items-center size-10 shrink-0 rounded-2xl"
          :class="look(message.severity).badge"
        >
          <i class="pi text-base font-bold" :class="look(message.severity).icon" />
        </span>
        <div class="min-w-0 flex-1 pt-0.5">
          <p v-if="message.summary" class="font-bold text-gray-950 leading-snug">
            {{ message.summary }}
          </p>
          <p v-if="message.detail" class="mt-0.5 text-sm text-gray-500 leading-snug">
            {{ message.detail }}
          </p>
        </div>
        <button
          type="button"
          class="absolute right-3 top-3 grid place-items-center size-7 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          @click="closeCallback"
        >
          <i class="pi pi-times text-xs" />
        </button>
        <span
          v-if="message.life"
          class="toast-progress absolute bottom-0 left-0 h-1 w-full origin-left opacity-60"
          :class="look(message.severity).bar"
          :style="{ animationDuration: `${message.life}ms` }"
        />
      </div>
    </template>
  </Toast>
</template>

<style scoped>
.toast-progress {
  animation-name: toast-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
