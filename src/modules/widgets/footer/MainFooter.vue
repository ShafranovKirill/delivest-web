<script setup lang="ts">
import { openLink } from '@/utils/browser'
import { useContactsStore } from '../contacts/stores/constacts.store'

const contactsStore = useContactsStore()
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="w-full py-12 px-6">
    <div class="mb-12 w-full max-w-5xl mx-auto">
      <Button
        class="w-full! rounded-full! h-14! shadow-sm justify-center"
        @click="contactsStore.openModal()"
      >
        <i class="pi pi-phone text-xl" style="-webkit-text-stroke: 0.5px"></i>
        <span class="text-base font-bold ml-3">Возникли вопросы? Нажмите, чтобы связаться!</span>
      </Button>
    </div>

    <div
      class="flex flex-col md:flex-row gap-12 max-w-5xl mx-auto items-center md:items-start justify-between"
    >
      <div class="text-center md:text-left flex-1 max-w-md">
        <h3 class="text-2xl font-bold mb-4">Оливия Пицца</h3>
        <p class="text-slate-600 leading-relaxed">
          Самая домашняя, уютная и по-настоящему душевная пицца в городе Орёл. Готовим с любовью для
          каждого из вас!
        </p>
      </div>

      <div class="flex flex-col gap-2 w-full md:w-auto min-w-60">
        <Button
          variant="text"
          severity="secondary"
          class="justify-center md:justify-start! h-12!"
          @click="openLink(contactsStore.contacts.social.vk)"
        >
          <i-vk-logo-black class="w-6 h-6 mr-3" />
          <span class="font-medium">Мы ВКонтакте</span>
        </Button>

        <Button
          variant="text"
          severity="secondary"
          class="justify-center md:justify-start! h-12!"
          @click="openLink(contactsStore.contacts.social.instagram)"
        >
          <i class="pi pi-instagram text-2xl! mr-3"></i>
          <span class="font-medium">Мы в Instagram</span>
        </Button>

        <Button
          variant="text"
          severity="secondary"
          class="justify-center md:justify-start! h-12!"
          @click="openLink(contactsStore.contacts.social.ymaps)"
        >
          <i class="pi pi-map-marker text-2xl! mr-3"></i>
          <span class="font-medium">Мы на Яндекс Картах</span>
        </Button>
      </div>
    </div>

    <div class="text-center text-sm text-slate-400 mt-12 pt-8">
      © {{ currentYear }} Оливия Пицца. Все права защищены.
    </div>
  </footer>
</template>
