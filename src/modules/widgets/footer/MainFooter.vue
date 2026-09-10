<script setup lang="ts">
import { openLink } from '@/utils/browser'
import { useContactsStore } from '../contacts/stores/constacts.store'

const contactsStore = useContactsStore()
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="w-full py-12 px-6">
    <!-- Кнопка связи -->
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
        <h3 class="text-2xl font-bold mb-4">
          {{ contactsStore.cafeName || 'Наше заведение' }}
        </h3>
        <p class="text-slate-600 leading-relaxed">
          Самая домашняя, уютная и по-настоящему душевная еда. Готовим с любовью для каждого из вас!
        </p>
      </div>

      <!-- Соцсети -->
      <div
        v-if="
          contactsStore.social.vk || contactsStore.social.instagram || contactsStore.social.whatsapp
        "
        class="flex flex-col gap-2 w-full md:w-auto min-w-60"
      >
        <Button
          v-if="contactsStore.social.vk"
          variant="text"
          severity="secondary"
          class="justify-center md:justify-start! h-12!"
          @click="openLink(contactsStore.social.vk)"
        >
          <i-vk-logo-black class="w-6 h-6 mr-3" />
          <span class="font-medium">Мы ВКонтакте</span>
        </Button>

        <Button
          v-if="contactsStore.social.instagram"
          variant="text"
          severity="secondary"
          class="justify-center md:justify-start! h-12!"
          @click="openLink(contactsStore.social.instagram)"
        >
          <i class="pi pi-instagram text-2xl! mr-3"></i>
          <span class="font-medium">Мы в Instagram</span>
        </Button>

        <Button
          v-if="contactsStore.social.whatsapp"
          variant="text"
          severity="secondary"
          class="justify-center md:justify-start! h-12!"
          @click="openLink(contactsStore.social.whatsapp)"
        >
          <i class="pi pi-whatsapp text-2xl! mr-3"></i>
          <span class="font-medium">Написать в WhatsApp</span>
        </Button>
      </div>
    </div>

    <!-- Копирайт -->
    <div class="text-center text-sm text-slate-400 mt-12 pt-8 border-t border-slate-100">
      © {{ currentYear }} {{ contactsStore.cafeName }}. Все права защищены.
    </div>
  </footer>
</template>
