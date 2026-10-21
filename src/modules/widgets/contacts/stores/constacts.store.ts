import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { formatPhoneNumber } from '../utils/tel-format'
import { copyText } from '@/utils/clipboard'

export const useContactsStore = defineStore('contacts', () => {
  const branchStore = useBranchStore()

  const phone = computed(() => branchStore.activeBranch?.branch_info?.phone_number || '')
  const phoneFormatted = computed(() => formatPhoneNumber(phone.value))

  const cafeName = computed(() => branchStore.activeBranch?.name || '')
  const address = computed(() => branchStore.activeBranch?.branch_info?.address || '')

  const social = computed(() => ({
    vk: branchStore.activeBranch?.branch_info?.vk_url || '',
    instagram: branchStore.activeBranch?.branch_info?.instagram_url || '',
    whatsapp: branchStore.activeBranch?.branch_info?.whatsapp_url || '',
  }))

  const isModalOpen = ref(false)

  const openModal = () => {
    isModalOpen.value = true
  }

  const closeModal = () => {
    isModalOpen.value = false
  }

  const toggleModal = () => {
    isModalOpen.value = !isModalOpen.value
  }

  const copyPhoneNumber = async () => {
    if (!phone.value) return false

    await copyText(phone.value)
    return true
  }

  const makeCall = () => {
    if (!phone.value) return

    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent)

    if (isMobile) {
      window.location.href = `tel:${phone.value}`
    } else {
      copyPhoneNumber()
    }
  }

  return {
    phone,
    phoneFormatted,
    cafeName,
    address,
    social,
    isModalOpen,

    openModal,
    closeModal,
    toggleModal,
    copyPhoneNumber,
    makeCall,
  }
})
