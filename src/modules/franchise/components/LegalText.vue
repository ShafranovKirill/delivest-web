<script setup lang="ts">
import { computed } from 'vue'
import { parseLegalText } from '../utils/legalText'

const props = defineProps<{ body: string }>()

const blocks = computed(() => parseLegalText(props.body))
</script>

<template>
  <div class="flex flex-col gap-3 text-[15px] leading-relaxed text-gray-700">
    <template v-for="(block, index) in blocks" :key="index">
      <h2 v-if="block.type === 'heading'" class="mt-4 text-lg font-bold text-gray-950">
        {{ block.text }}
      </h2>
      <ul v-else-if="block.type === 'list'" class="list-disc pl-5 flex flex-col gap-1">
        <li v-for="item in block.items" :key="item">{{ item }}</li>
      </ul>
      <p v-else>
        <template v-for="(line, lineIndex) in block.lines" :key="lineIndex">
          <br v-if="lineIndex > 0" />{{ line }}
        </template>
      </p>
    </template>
  </div>
</template>
