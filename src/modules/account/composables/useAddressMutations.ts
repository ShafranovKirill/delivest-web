import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { AccountService, type AddressPayload } from '../api/account.service'
import { ADDRESSES_KEY } from './useAddressesQuery'

export const useAddressMutations = () => {
  const queryClient = useQueryClient()
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY })

  const save = useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: AddressPayload }) =>
      id ? AccountService.updateAddress(id, payload) : AccountService.createAddress(payload),
    onSuccess,
  })

  const remove = useMutation({ mutationFn: AccountService.deleteAddress, onSuccess })

  return { save, remove }
}
