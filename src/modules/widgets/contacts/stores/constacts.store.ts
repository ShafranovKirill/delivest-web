import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { formatPhoneNumber } from '../utils/tel-format'

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
    if (!phone.value) return { success: false, message: 'Номер отсутствует' }

    try {
      await navigator.clipboard.writeText(phone.value)
      return { success: true, message: 'Номер скопирован!' }
    } catch (error) {
      console.error('Ошибка копирования:', error)
      const textArea = document.createElement('textarea')
      textArea.value = phone.value
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return { success: true, message: 'Номер скопирован!' }
    }
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
