<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SidebarTile from '@/modules/widgets/sidebar/SidebarTile.vue'
import { useInstallPrompt } from '../composables/useInstallPrompt'
import InstallGuideDialog from './InstallGuideDialog.vue'

const { t } = useI18n()
const { canInstall, needsGuide, promptInstall } = useInstallPrompt()
const guideVisible = ref(false)

function install() {
  if (needsGuide.value) guideVisible.value = true
  else promptInstall()
}
</script>

<template>
  <template v-if="canInstall">
    <SidebarTile
      icon="pi-mobile"
      :title="t('pwa.install.title')"
      :subtitle="t('pwa.install.subtitle')"
      @click="install"
    />
    <InstallGuideDialog v-model:visible="guideVisible" />
  </template>
</template>
