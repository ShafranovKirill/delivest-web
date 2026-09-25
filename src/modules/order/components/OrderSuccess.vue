name=OrderSuccess.vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useContactsStore } from '@/modules/widgets/contacts/stores/constacts.store'
import { useOrderStore } from '../stores/order.store'
import Button from 'primevue/button'

const router = useRouter()
const contactsStore = useContactsStore()
const orderStore = useOrderStore()

function handleReturnHome() {
  orderStore.resetOrderState()
  router.push('/')
}
</script>

<template>
  <div class="flex flex-col items-center text-center gap-6 px-2 py-4 max-w-md mx-auto">
    <div
      class="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl shadow-sm"
    >
      ✓
    </div>

    <div class="flex flex-col gap-1.5">
      <h2 class="text-xl sm:text-2xl font-bold">Заказ успешно оформлен!</h2>
      <p class="text-sm text-muted-foreground">Спасибо за ваш выбор. Мы уже начали подготовку.</p>
    </div>

    <div class="w-full flex flex-col gap-3 py-2 border-y border-border/40 text-sm">
      <div class="flex items-center justify-center gap-2 text-foreground font-medium">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Ожидайте звонок оператора
      </div>
      <p class="text-xs text-muted-foreground leading-relaxed px-4">
        Мы свяжемся с вами в течение <span class="font-semibold text-foreground">5 минут</span> для
        подтверждения деталей. Если этого не случилось, пожалуйста, позвоните нам.
      </p>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 w-full mt-2">
      <Button
        v-if="contactsStore.phone"
        as="a"
        :href="`tel:${contactsStore.phone}`"
        label="Позвонить нам"
        severity="secondary"
        class="rounded-4xl! h-14 font-semibold w-full flex-1"
      />

      <Button
        label="Вернуться в меню"
        class="rounded-4xl! h-14 font-semibold w-full flex-1"
        @click="handleReturnHome"
      />
    </div>
  </div>
</template>
