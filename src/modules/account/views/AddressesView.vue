<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { getApiErrorMessage } from '@/api/errors'
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import EmptyState from '@/modules/shared/components/ui/EmptyState.vue'
import SkeletonList from '@/modules/shared/components/ui/SkeletonList.vue'
import AuthRequired from '@/modules/auth/components/AuthRequired.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import AddressCard from '../components/AddressCard.vue'
import AddressFormDialog from '../components/AddressFormDialog.vue'
import AddressEditorDialog from '../components/AddressEditorDialog.vue'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import type { ClientAddress } from '../api/account.service'
import { useAddressesQuery } from '../composables/useAddressesQuery'
import { useAddressMutations } from '../composables/useAddressMutations'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const authStore = useAuthStore()
const franchiseStore = useFranchiseStore()
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
  <PageShell
    :title="t('account.addresses.title')"
    :subtitle="t('account.addresses.subtitle')"
    width="narrow"
  >
    <template v-if="authStore.isAuthenticated" #actions>
      <Button :label="t('common.add')" icon="pi pi-plus" rounded @click="openDialog(null)" />
    </template>

    <AuthRequired :text="t('account.addresses.authText')">
      <SkeletonList v-if="isLoading" class="flex flex-col gap-2" />

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
        :title="t('account.addresses.emptyTitle')"
        :text="t('account.addresses.emptyText')"
      />

      <AddressEditorDialog
        v-if="franchiseStore.addressMap"
        :visible="isDialogOpen"
        :address="editing"
        @close="isDialogOpen = false"
      />
      <AddressFormDialog
        v-else
        :visible="isDialogOpen"
        :address="editing"
        @close="isDialogOpen = false"
      />
    </AuthRequired>
  </PageShell>
</template>
