import {
  getAddress,
  getCafeName,
  getInstagramUrl,
  getPhoneNumber,
  getVkUrl,
  getYmapsUrl,
} from '@/utils/env'
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { formatPhoneNumber } from '../utils/tel-format'

export const useContactsStore = defineStore('contacts', () => {
  const rawPhone = getPhoneNumber()

  const contacts = reactive({
    cafeName: getCafeName(),
    phone: rawPhone,
    phoneFormatted: computed(() => formatPhoneNumber(rawPhone)),
    address: getAddress(),
    social: {
      vk: getVkUrl(),
      instagram: getInstagramUrl(),
      ymaps: getYmapsUrl(),
    },
  })
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
    try {
      await navigator.clipboard.writeText(contacts.phone)
      return { success: true, message: 'Номер скопирован!' }
    } catch (error) {
      console.error('Ошибка копирования:', error)
      const textArea = document.createElement('textarea')
      textArea.value = contacts.phone
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return { success: true, message: 'Номер скопирован!' }
    }
  }

  const makeCall = () => {
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent)

    if (isMobile) {
      window.location.href = `tel:${contacts.phone}`
    } else {
      copyPhoneNumber()
    }
  }

  return {
    contacts,
    isModalOpen,

    openModal,
    closeModal,
    toggleModal,
    copyPhoneNumber,
    makeCall,
  }
})
