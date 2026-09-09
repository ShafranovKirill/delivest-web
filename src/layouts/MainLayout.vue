<script setup lang="ts">
import BranchSelectModal from '@/modules/branch/components/BranchSelectModal.vue'
import ContactModal from '@/modules/widgets/contacts/components/ContactModal.vue'
import MainFooter from '@/modules/widgets/footer/MainFooter.vue'
import MainHeader from '@/modules/widgets/header/MainHeader.vue'
import TopBar from '@/modules/widgets/header/TopBar.vue'
import MainSidebar from '@/modules/widgets/sidebar/MainSidebar.vue'
</script>
<template>
  <div
    class="min-h-screen flex flex-col mx-auto items-center bg-white rounded-4xl lg:rounded-b-[70px]"
  >
    <TopBar />
    <MainHeader />

    <main class="w-full mx-auto">
      <router-view />
    </main>
  </div>
  <div class="w-full max-w-7xl mx-auto">
    <MainFooter />
  </div>
  <MainSidebar />
  <ContactModal />
  <BranchSelectModal />
</template>
