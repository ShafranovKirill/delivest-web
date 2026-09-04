<script setup lang="ts">
const props = defineProps<{ price: number }>()
</script>
<template>
  <Button
    :label="`В корзину за ${props.price} ₽`"
    class="whitespace-nowrap rounded-4xl! w-full!"
  ></Button>
</template>
