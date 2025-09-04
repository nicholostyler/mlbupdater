<script setup lang="ts">
import { useRouter } from 'vue-router'

interface HomePageComponentHeaderProps {
  headerText: {
    type: string,
    required: true
  }
  routeHeader: {
    type: string,
    required: false
  }
  routeParam: {
    type: string,
    required: false
  }
}

const props = defineProps<HomePageComponentHeaderProps>()
const router = useRouter()

function open() {
  if (props.routeParam === undefined) return;
  router.push({ name: props.routeParam, params: { gamePk } });
}
</script>

<template>
  <header class="mb-2 flex items-center justify-between">
    <h2 class="text-lg font-semibold tracking-tight">
      {{ props.headerText }}
    </h2>
    <div v-if="routeParam && routeHeader" class="text-sm text-gray-500">
      Season {{ season }}
    </div>
  </header>
</template>

<style scoped></style>
