<script setup lang="ts">
import { useContactsStore } from '@/modules/widgets/contacts/stores/constacts.store'
import Button from 'primevue/button'

const contactsStore = useContactsStore()

defineEmits<{
  (e: 'home'): void
}>()
</script>

<template>
  <div class="flex flex-col items-center text-center gap-6 px-2">
    <div
      class="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl"
    >
      ✓
    </div>

    <div class="flex flex-col gap-2">
      <h2 class="text-xl sm:text-2xl font-bold">Заказ успешно оформлен!</h2>
    </div>

    <div class="flex flex-col gap-3 text-sm max-w-md">
      <p class="font-medium text-foreground">
        Вам позвонит оператор в течение 5 минут для подтверждения заказа.
      </p>
      <p class="text-muted-foreground text-xs leading-relaxed">
        Если оператор не связался с вами в указанное время, пожалуйста, свяжитесь с работниками
        кафе:
        <template v-if="contactsStore.phone">
          <a
            :href="`tel:${contactsStore.phone}`"
            class="font-semibold text-primary hover:underline block mt-1 text-sm"
          >
            {{ contactsStore.phoneFormatted || contactsStore.phone }}
          </a>
        </template>
        <template v-else>
          <span class="font-semibold text-foreground block mt-1 text-sm">
            Свяжитесь с работниками кафе
          </span>
        </template>
      </p>
    </div>

    <Button
      label="Вернуться на главную"
      class="rounded-2xl px-8 h-12 font-semibold w-full sm:w-auto"
      @click="$emit('home')"
    />
  </div>
</template>
