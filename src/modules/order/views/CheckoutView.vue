name=CheckoutView.vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import StepPanels from 'primevue/steppanels'
import Step from 'primevue/step'
import StepPanel from 'primevue/steppanel'

import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useOrderStore } from '../stores/order.store'
import OrderForm from '../components/OrderForm.vue'
import OrderSummary from '../components/OrderSummary.vue'
import OrderSuccess from '../components/OrderSuccess.vue'

const router = useRouter()
const cartStore = useCartStore()
const orderStore = useOrderStore()

onMounted(async () => {
  try {
    await cartStore.fetchCart(true)
  } catch (e) {
    console.error(e)
  }
})
</script>

<template>
  <div class="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
    <h1 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Оформление заказа</h1>

    <Message v-if="orderStore.errorMessage" severity="error" class="mb-6">{{
      orderStore.errorMessage
    }}</Message>

    <div
      v-if="cartStore.isLoading && !cartStore.isInitialized"
      class="text-center py-12 text-muted-foreground"
    >
      Проверяем корзину...
    </div>

    <div
      v-else-if="cartStore.isEmpty && Number(orderStore.activeStep) !== 3"
      class="text-center py-12 bg-muted/20 rounded-3xl p-6 sm:p-8"
    >
      <p class="text-lg font-medium mb-4">Ваша корзина пуста или устарела</p>
      <Button label="Вернуться к меню" @click="router.push('/')" />
    </div>

    <Stepper
      :value="orderStore.activeStep"
      @update:value="orderStore.handleStepChange"
      class="w-full"
    >
      <StepList>
        <Step :value="1">Корзина</Step>
        <Step :value="2" :disabled="cartStore.isEmpty">Данные</Step>
        <Step :value="3" :disabled="!orderStore.createdOrderId">Заказ принят</Step>
      </StepList>

      <StepPanels class="mt-4 sm:mt-6">
        <StepPanel :value="1">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div class="lg:col-span-7 flex flex-col gap-6"></div>
            <div class="lg:col-span-5 flex flex-col gap-4">
              <OrderSummary />
              <Button
                label="Далее"
                class="w-full h-14 rounded-2xl text-base font-semibold"
                @click="orderStore.activeStep = 2"
              />
            </div>
          </div>
        </StepPanel>

        <StepPanel :value="2">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div class="lg:col-span-12">
              <OrderForm :isLoading="orderStore.isLoading" @submit="orderStore.createOrder" />
            </div>
          </div>
        </StepPanel>

        <StepPanel :value="3">
          <div class="max-w-xl mx-auto">
            <OrderSuccess />
          </div>
        </StepPanel>
      </StepPanels>
    </Stepper>
  </div>
</template>
