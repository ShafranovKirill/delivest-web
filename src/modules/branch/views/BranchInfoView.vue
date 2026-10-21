<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapStore } from '../stores/map.store'
import BranchYandexMap from '../components/BranchYandexMap.vue'
import { useBranchStore } from '../stores/branch.store.ts'
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'
import EmptyState from '@/modules/shared/components/ui/EmptyState.vue'
import { formatPhoneNumber } from '@/modules/widgets/contacts/utils/tel-format'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const branchStore = useBranchStore()
const mapStore = useMapStore()

const { activeBranch, isOpenNow, closingTimeToday, formattedScheduleList, workingHours } =
  storeToRefs(branchStore)
const { isMapEnabled, coordinates, yandexOrgUrl } = storeToRefs(mapStore)

const info = computed(() => activeBranch.value?.branch_info ?? null)
const phoneLabel = computed(() =>
  info.value?.phone_number ? formatPhoneNumber(info.value.phone_number) : null,
)

const socials = computed(() =>
  [
    { key: 'vk', url: info.value?.vk_url, label: t('branch.info.vk'), icon: null },
    { key: 'instagram', url: info.value?.instagram_url, label: 'Instagram', icon: 'pi-instagram' },
    { key: 'whatsapp', url: info.value?.whatsapp_url, label: 'WhatsApp', icon: 'pi-whatsapp' },
  ].filter((item) => Boolean(item.url)),
)
</script>

<template>
  <PageShell :title="t('branch.info.title')" :subtitle="t('branch.info.subtitle')" width="default">
    <template #actions>
      <button
        type="button"
        class="group inline-flex items-center gap-3 rounded-full bg-gray-50 border border-gray-100 py-2 pl-2 pr-4 hover:border-primary transition-colors cursor-pointer"
        @click="branchStore.openModal()"
      >
        <span class="grid place-items-center size-9 rounded-full bg-white text-primary shadow-xs">
          <i class="pi pi-map-marker" />
        </span>
        <span class="flex flex-col items-start leading-tight">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {{ t('branch.info.branch') }}
          </span>
          <span class="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
            {{ activeBranch?.name || t('branch.notSelected') }}
          </span>
        </span>
        <i class="pi pi-chevron-right text-xs text-gray-400 group-hover:text-primary" />
      </button>
    </template>

    <div v-if="activeBranch" class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      <SurfaceCard icon="pi-clock" :label="t('branch.info.now')" class="md:col-span-2">
        <template #value>
          <span class="inline-flex items-center gap-2">
            <span
              class="size-2.5 rounded-full"
              :class="isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'"
            />
            {{ isOpenNow ? t('branch.info.open') : t('branch.info.closed') }}
          </span>
        </template>
        <template v-if="workingHours" #aside>
          <span
            class="hidden sm:inline-flex rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-600 shadow-xs"
          >
            {{ t('branch.info.today', { time: closingTimeToday }) }}
          </span>
        </template>
      </SurfaceCard>

      <SurfaceCard icon="pi-map-marker" :label="t('branch.info.address')" class="md:col-span-2">
        <template #value>{{ info?.address || t('branch.info.noAddress') }}</template>
        <template v-if="yandexOrgUrl" #aside>
          <a
            :href="yandexOrgUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-primary shadow-xs hover:bg-primary-soft transition-colors"
          >
            <span class="hidden sm:inline">{{ t('branch.info.yandexMaps') }}</span>
            <i class="pi pi-external-link text-xs" />
          </a>
        </template>

        <div v-if="isMapEnabled && coordinates" class="overflow-hidden rounded-2xl">
          <BranchYandexMap
            :coordinates="coordinates"
            :branch-name="activeBranch.name"
            :address="info?.address"
          />
        </div>
      </SurfaceCard>

      <SurfaceCard
        icon="pi-phone"
        :label="t('branch.info.phone')"
        :as="info?.phone_number ? 'a' : 'div'"
        :href="info?.phone_number ? `tel:${info.phone_number}` : undefined"
        :class="{ 'hover:border-primary transition-colors': info?.phone_number }"
      >
        <template #value>{{ phoneLabel || t('branch.info.notSet') }}</template>
        <template v-if="info?.phone_number" #aside>
          <i class="pi pi-arrow-up-right text-gray-400" />
        </template>
      </SurfaceCard>

      <SurfaceCard icon="pi-car" :label="t('branch.info.delivery')">
        <template #value>
          {{
            info?.delivery_time
              ? t('branch.info.deliveryTime', { minutes: info.delivery_time })
              : t('branch.info.noDeliveryTime')
          }}
        </template>
      </SurfaceCard>

      <SurfaceCard icon="pi-calendar" :label="t('branch.info.hours')" class="md:col-span-2">
        <template #value>{{ t('branch.info.hoursHint') }}</template>

        <ul
          v-if="workingHours && formattedScheduleList.length"
          class="grid grid-cols-1 sm:grid-cols-2 gap-2"
        >
          <li
            v-for="item in formattedScheduleList"
            :key="item.day"
            class="flex items-center justify-between rounded-2xl px-4 py-3 text-sm border"
            :class="item.isToday ? 'bg-primary-soft border-primary/20' : 'bg-white border-gray-100'"
          >
            <span class="font-medium" :class="item.isToday ? 'text-primary' : 'text-gray-700'">
              {{ item.day }}
              <span v-if="item.isToday" class="ml-1 text-xs font-semibold"
                >· {{ t('branch.info.todayMark') }}</span
              >
            </span>
            <span v-if="item.enabled" class="font-semibold text-gray-900 tabular-nums">
              {{ item.open }} — {{ item.close }}
            </span>
            <span v-else class="font-medium text-gray-400">{{ t('branch.schedule.dayOff') }}</span>
          </li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ t('branch.schedule.notSet') }}</p>
      </SurfaceCard>

      <SurfaceCard
        v-if="socials.length"
        icon="pi-heart"
        :label="t('branch.info.socials')"
        class="md:col-span-2"
      >
        <template #value>{{ t('branch.info.socialsHint') }}</template>

        <div class="flex flex-wrap gap-2">
          <a
            v-for="social in socials"
            :key="social.key"
            :href="social.url!"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-full bg-white border border-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-xs hover:border-primary hover:text-primary transition-colors"
          >
            <i-vk-logo-black v-if="social.key === 'vk'" class="size-4" />
            <i v-else :class="['pi', social.icon]" />
            {{ social.label }}
          </a>
        </div>
      </SurfaceCard>
    </div>

    <EmptyState
      v-else
      icon="pi-map-marker"
      :title="t('branch.info.emptyTitle')"
      :text="t('branch.info.emptyText')"
    >
      <Button :label="t('branch.choose')" rounded @click="branchStore.openModal()" />
    </EmptyState>
  </PageShell>
</template>
