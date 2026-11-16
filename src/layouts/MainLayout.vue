<script setup lang="ts">
import { watch } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useFunnelAnalytics } from '@/modules/analytics/useFunnelAnalytics'
import { useSourceClaim } from '@/modules/analytics/useSourceClaim'
import BranchSelectModal from '@/modules/branch/components/BranchSelectModal.vue'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'
import ContactModal from '@/modules/widgets/contacts/components/ContactModal.vue'
import MainFooter from '@/modules/widgets/footer/MainFooter.vue'
import MainHeader from '@/modules/widgets/header/MainHeader.vue'
import TopBar from '@/modules/widgets/header/TopBar.vue'
import UniversalMobileModal from '@/modules/widgets/modal/mobile-modal/components/UniversalMobileModal.vue'
import UniversalDesktopModal from '@/modules/widgets/modal/desktop-modal/components/UniversalDesktopModal.vue'
import MainSidebar from '@/modules/widgets/sidebar/MainSidebar.vue'
import AuthModal from '@/modules/auth/components/AuthModal.vue'
import ProfileDialog from '@/modules/auth/components/ProfileDialog.vue'
import AddressPrompt from '@/modules/fulfillment/components/AddressPrompt.vue'
import FulfillmentPicker from '@/modules/fulfillment/components/FulfillmentPicker.vue'
import { useLiveOrders } from '@/modules/order/composables/useLiveOrders'

const viewportStore = useViewportStore()
const branchStore = useBranchStore()
const authStore = useAuthStore()
const analytics = useFunnelAnalytics()
useSourceClaim()
watch(
  () => [branchStore.activeBranch?.id, branchStore.activeBranch?.branch_info?.analytics_funnel_enabled, authStore.client?.id, authStore.sessionEpoch],
  ([branchId, enabled]) => { if (branchId && enabled === true) analytics.track('visit') },
  { immediate: true },
)
useLiveOrders()
</script>
<template>
  <div
    class="min-h-screen flex flex-col mx-auto items-center bg-white rounded-b-4xl lg:rounded-b-[70px] overflow-clip"
  >
    <TopBar v-if="!viewportStore.isMobile" />
    <MainHeader />

    <main class="w-full mx-auto flex-1">
      <router-view />
    </main>
  </div>
  <div class="w-full max-w-7xl mx-auto">
    <MainFooter />
  </div>
  <MainSidebar />
  <ContactModal />
  <BranchSelectModal />
  <AuthModal />
  <ProfileDialog />
  <AddressPrompt />
  <FulfillmentPicker />
  <UniversalMobileModal v-if="viewportStore.isMobile" />
  <UniversalDesktopModal v-if="!viewportStore.isMobile" />
</template>
