<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { getApiErrorMessage } from '@/api/errors'
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import EmptyState from '@/modules/shared/components/ui/EmptyState.vue'
import AuthRequired from '@/modules/auth/components/AuthRequired.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import AddressCard from '../components/AddressCard.vue'
import AddressFormDialog from '../components/AddressFormDialog.vue'
import type { ClientAddress } from '../api/account.service'
import { useAddressesQuery } from '../composables/useAddressesQuery'
import { useAddressMutations } from '../composables/useAddressMutations'

const authStore = useAuthStore()
const toast = useToast()
const { data: addresses, isLoading } = useAddressesQuery()
const { remove } = useAddressMutations()

const isDialogOpen = ref(false)
const editing = ref<ClientAddress | null>(null)

function openDialog(address: ClientAddress | null) {
  editing.value = address
  isDialogOpen.value = true
}

function removeAddress(address: ClientAddress) {
  remove.mutate(address.id, {
    onError: (error) =>
      toast.add({ severity: 'error', summary: getApiErrorMessage(error), life: 3000 }),
  })
}
</script>

<template>
  <PageShell title="Мои адреса" subtitle="Нажмите на адрес, чтобы изменить его" width="narrow">
    <template v-if="authStore.isAuthenticated" #actions>
      <Button label="Добавить" icon="pi pi-plus" rounded @click="openDialog(null)" />
    </template>

    <AuthRequired text="Сохранённые адреса доставки появятся после входа">
      <div v-if="isLoading" class="py-16 text-center">
        <i class="pi pi-spin pi-spinner text-3xl text-primary" />
      </div>

      <div v-else-if="addresses?.length" class="flex flex-col gap-2">
        <AddressCard
          v-for="address in addresses"
          :key="address.id"
          :address="address"
          @edit="openDialog"
          @remove="removeAddress"
        />
      </div>

      <EmptyState
        v-else
        icon="pi-map-marker"
        title="Адресов пока нет"
        text="Адрес сохранится автоматически после заказа с доставкой"
      />

      <AddressFormDialog :visible="isDialogOpen" :address="editing" @close="isDialogOpen = false" />
    </AuthRequired>
  </PageShell>
</template>
