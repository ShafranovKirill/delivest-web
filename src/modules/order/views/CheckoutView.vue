<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import StepPanels from 'primevue/steppanels'
import Step from 'primevue/step'
import StepPanel from 'primevue/steppanel'

import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useOrderStore } from '../stores/order.store'
import OrderForm from '../components/OrderForm.vue'
import OrderSummary from '../components/OrderSummary.vue'
import OrderSuccess from '../components/OrderSuccess.vue'

const router = useRouter()
const cartStore = useCartStore()
const branchStore = useBranchStore()
const orderStore = useOrderStore()

onMounted(async () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  try {
    await cartStore.fetchCart(branchStore.activeBranch?.id, true)
  } catch (e) {
    console.error(e)
  }
})

watch(
  () => orderStore.activeStep,
  () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
)

onBeforeRouteLeave((to, from, next) => {
  if (orderStore.createdOrderId) {
    orderStore.clearCreatedOrder()
  }
  next()
})

onUnmounted(() => {
  if (orderStore.createdOrderId) {
    orderStore.clearCreatedOrder()
  }
})
</script>

<template>
  <div class="bg-gray-200 w-full min-h-screen flex flex-col justify-start">
    <div
      class="bg-white rounded-4xl sm:rounded-[4rem] min-h-[calc(100vh-3.8rem)] md:min-h-[calc(100vh-6rem)] w-full py-8 px-4 sm:px-8 flex flex-col"
    >
      <div class="max-w-5xl mx-auto w-full flex-1 flex flex-col">
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
          v-else
          :value="orderStore.activeStep"
          @update:value="orderStore.handleStepChange"
          class="w-full flex-1 flex flex-col"
          :pt="{
            separator: 'translate-y-[-14px]',
          }"
        >
          <StepList>
            <Step
              :value="1"
              :disabled="Boolean(orderStore.createdOrderId)"
              :pt="{ header: 'flex-col items-center gap-2' }"
            >
              Корзина
            </Step>

            <Step
              :value="2"
              :disabled="cartStore.isEmpty || Boolean(orderStore.createdOrderId)"
              :pt="{ header: 'flex-col items-center gap-2' }"
            >
              Данные
            </Step>

            <Step
              :value="3"
              :disabled="!orderStore.createdOrderId"
              :pt="{ header: 'flex-col items-center gap-2' }"
            >
              Заказ принят
            </Step>
          </StepList>

          <StepPanels class="mt-4 sm:mt-6 flex-1">
            <StepPanel :value="1">
              <div class="w-full">
                <OrderSummary />
              </div>
            </StepPanel>

            <StepPanel :value="2">
              <div class="w-full">
                <OrderForm :isLoading="orderStore.isLoading" @submit="orderStore.createOrder" />
              </div>
            </StepPanel>

            <StepPanel :value="3">
              <div class="w-full">
                <OrderSuccess />
              </div>
            </StepPanel>
          </StepPanels>
        </Stepper>
      </div>
    </div>
  </div>
</template>
