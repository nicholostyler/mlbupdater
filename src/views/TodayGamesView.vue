<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import Button from 'primevue/button'
  import Skeleton from 'primevue/skeleton'
  import Scoreboard from '@/components/Scoreboard.vue'
  import { todayYYYYMMDD, fetchSchedulesByDate } from '@/services/mlb'
  import type { ScheduleGame } from '@/data/models/ScheduleGame.ts'

  const todayDate = todayYYYYMMDD()

  const loading = ref(true)
  const error = ref<string | null>(null)
  const scheduledGames = ref<ScheduleGame[]>([])

  onMounted(load)

  async function load() {
    loading.value = true
    error.value = null
    try {
      scheduledGames.value = await fetchSchedulesByDate(todayDate)
    } catch (e: any) {
      console.error(e)
      error.value = e?.message || 'Failed to load games.'
      scheduledGames.value = []
    } finally {
      loading.value = false
    }

  }

</script>

<template>
  <div class="mx-auto max-w-7xl p-4 space-y-4">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Today’s Games ({{ todayDate }})</h1>
      <Button label="Refresh" size="small" @click="load" />
    </header>

    <div v-if="loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="i in 6" :key="i" height="7rem" class="rounded-2xl" />
    </div>

    <div v-else-if="error" class="text-red-600">
      {{ error }}
    </div>

    <div v-else-if="!scheduledGames.length" class="text-gray-500">
      No MLB games found for {{ todayDate }}.
    </div>

    <!-- List/grid of Scoreboard cards -->
    <ul class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <li v-for="game in scheduledGames" :key="game.gamePk">
        <!-- If your Scoreboard component accepts :game-pk, this just works.
             If it uses a different prop, swap accordingly (e.g., <ScoreboardCard :game-pk="pk" />). -->
        <Scoreboard :game-schedule="game" :poll-ms="15000" />
      </li>
    </ul>
  </div>
</template>

<style scoped>

</style>
