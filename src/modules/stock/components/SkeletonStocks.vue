<template>
  <div class="flex gap-4 overflow-hidden p-2" aria-busy="true">
    <Skeleton
      v-for="i in 6"
      :key="i"
      class="shrink-0 w-[calc(50%-0.5rem)] sm:w-[calc(33%-0.66rem)] md:w-[calc(25%-0.75rem)] lg:w-[calc(20%-0.8rem)] max-w-50 aspect-4/5 h-auto! rounded-2xl!"
    />
  </div>
</template>
