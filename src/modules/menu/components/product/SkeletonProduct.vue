<template>
  <div
    class="w-full h-full p-2 rounded-4xl bg-white flex flex-col justify-between"
    aria-hidden="true"
  >
    <div>
      <Skeleton width="100%" height="auto" class="aspect-square rounded-4xl! mb-2" />
      <Skeleton width="75%" height="1.75rem" class="mx-auto mb-2" />
    </div>
    <Skeleton width="80px" height="2.5rem" borderRadius="2rem" class="mx-auto" />
  </div>
</template>
