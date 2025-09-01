<template>
  <main class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-4">
    <!-- Page header -->
    <header class="mb-4 flex items-center justify-between gap-3 flex-wrap">
      <h1 class="text-xl font-semibold tracking-tight">MLB Division Standings</h1>

      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">Season</span>
        <Dropdown
          v-model="season"
          :options="seasons"
          optionLabel="label"
          optionValue="value"
          class="min-w-[112px]"
          size="small"
        />
      </div>
    </header>

    <!-- Standings grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <DivisionStanding
        v-for="d in divisions"
        :key="d.key"
        :division-id="d.id"
        :title="d.name"
        :season="season"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Dropdown from 'primevue/dropdown'
import DivisionStanding from '@/components/DivisionStanding.vue'

// If you put the helper elsewhere, adjust the path:
import { DIVISIONS } from '@/utils/TeamHelpers' // must expose { AL_EAST:{id,name}, ... }

const seasons = computed(() => {
  const now = new Date().getFullYear()
  const start = 2010
  return Array.from({ length: now - start + 1 }, (_, i) => {
    const y = (now - i).toString()
    return { label: y, value: y }
  })
})

const season = ref(new Date().getFullYear().toString())

const divisions = computed(() => [
  { key: 'AL_EAST',    id: DIVISIONS.AL_EAST.id,     name: DIVISIONS.AL_EAST.name },
  { key: 'AL_CENTRAL', id: DIVISIONS.AL_CENTRAL.id,  name: DIVISIONS.AL_CENTRAL.name },
  { key: 'AL_WEST',    id: DIVISIONS.AL_WEST.id,     name: DIVISIONS.AL_WEST.name },
  { key: 'NL_EAST',    id: DIVISIONS.NL_EAST.id,     name: DIVISIONS.NL_EAST.name },
  { key: 'NL_CENTRAL', id: DIVISIONS.NL_CENTRAL.id,  name: DIVISIONS.NL_CENTRAL.name },
  { key: 'NL_WEST',    id: DIVISIONS.NL_WEST.id,     name: DIVISIONS.NL_WEST.name }
])
</script>

<style scoped>
/* Optional: keep numbers tidy wherever tables appear */
:global(.tabular-nums) { font-variant-numeric: tabular-nums; }
</style>
