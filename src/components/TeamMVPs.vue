<!-- TeamMVPs.vue (Vue 3 + Tailwind + PrimeVue) -->
<template>
  <section class="relative">
    <header class="mb-2 flex items-center justify-between">
      <h2 class="text-lg font-semibold tracking-tight">
        Team MVPs
      </h2>

    </header>

    <!-- Loading skeletons -->
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2">
      <Card class="overflow-hidden">
        <template #title>Hitting</template>
        <template #content>
          <Skeleton v-for="i in 3" :key="'h'+i" height="28px" class="my-2 rounded-md" />
        </template>
      </Card>
      <Card class="overflow-hidden">
        <template #title>Pitching</template>
        <template #content>
          <Skeleton v-for="i in 2" :key="'p'+i" height="28px" class="my-2 rounded-md" />
        </template>
      </Card>
    </div>

    <!-- Content -->
    <div v-else class="grid gap-4 sm:grid-cols-2">
      <!-- Hitting -->
      <Card class="overflow-hidden">
        <template #title>Hitting</template>
        <template #content>
          <ul role="list" class="divide-y divide-gray-100 dark:divide-slate-800">
            <li
              v-for="item in hittingRows"
              :key="item.key"
              class="flex items-center gap-3 py-2"
            >
              <!-- Stat label -->
              <div class="w-16 shrink-0 text-sm text-gray-500">{{ item.label }}</div>

              <!-- Player (clickable to emit) -->
              <button
                type="button"
                class="group inline-flex min-w-0 items-center gap-2 text-left"
                @click="emitPlayer(item.player.id)"
                :aria-label="'View ' + item.player.fullName + ' details'"
              >
                <Avatar
                  v-if="showAvatars"
                  :label="initials(item.player.fullName)"
                  shape="circle"
                  class="hidden sm:inline-flex"
                />
                <span class="truncate font-medium group-hover:underline">{{ item.player.fullName }}</span>
              </button>

              <!-- Value chip -->
              <div class="ml-auto">
                <Tag :value="item.displayValue" severity="success" class="tabular-nums" />
              </div>
            </li>
          </ul>
        </template>
      </Card>

      <!-- Pitching -->
      <Card class="overflow-hidden">
        <template #title>Pitching</template>
        <template #content>
          <ul role="list" class="divide-y divide-gray-100 dark:divide-slate-800">
            <li
              v-for="item in pitchingRows"
              :key="item.key"
              class="flex items-center gap-3 py-2"
            >
              <div class="w-16 shrink-0 text-sm text-gray-500">{{ item.label }}</div>
              <button
                type="button"
                class="group inline-flex min-w-0 items-center gap-2 text-left"
                @click="emitPlayer(item.player.id)"
                :aria-label="'View ' + item.player.fullName + ' details'"
              >
                <Avatar
                  v-if="showAvatars"
                  :label="initials(item.player.fullName)"
                  shape="circle"
                  class="hidden sm:inline-flex"
                />
                <span class="truncate font-medium group-hover:underline">{{ item.player.fullName }}</span>
              </button>
              <div class="ml-auto">
                <Tag :value="item.displayValue" severity="success" class="tabular-nums" />
              </div>
            </li>
          </ul>
        </template>
      </Card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import Skeleton from 'primevue/skeleton'

import { useTeam } from '@/composables/useTeam'
import { fetchTeamLeaders, type TeamLeader } from '@/services/mlb'

type LeaderKey =
  | 'homeRuns'
  | 'runsBattedIn'
  | 'battingAverage'
  | 'strikeouts'
  | 'earnedRunAverage'

type LeaderMap = Partial<Record<LeaderKey, TeamLeader>>


type Props = {
  teamId?: number
  season?: string
  showAvatars?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  season: new Date().getFullYear().toString(),
  showAvatars: true
})

const emit = defineEmits<{ (e: 'select-player', playerId: number): void }>()
const { favorite } = useTeam()

const loading = ref(true)
const leaders = ref<LeaderMap>({})

async function load() {
  const team = props.teamId ?? favorite.value?.id
  if (!team) return
  loading.value = true
  try {
    leaders.value = await fetchTeamLeaders(team, props.season)
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(() => [props.teamId, props.season], load)

function labelFor(k: string): string {
  switch (k) {
    case 'homeRuns': return 'HR'
    case 'runsBattedIn': return 'RBI'
    case 'battingAverage': return 'AVG'
    case 'strikeouts': return 'SO'
    case 'earnedRunAverage': return 'ERA'
    default: return k
  }
}

function formatValue(k: string, v: string): string {
  if (!v) return '—'
  if (k === 'battingAverage' || k === 'earnedRunAverage') {
    const n = Number(v)
    if (!Number.isFinite(n)) return v
    if (k === 'battingAverage') {
      return n < 1 ? `.${String(Math.round(n * 1000)).padStart(3, '0')}` : n.toFixed(3)
    }
    if (k === 'earnedRunAverage') return n.toFixed(2)
  }
  return v
}

const hittingRows = computed(() => {
  const order = ['homeRuns', 'runsBattedIn', 'battingAverage'] as const
  return order
    .map((key) => leaders.value[key] && ({
      key,
      label: labelFor(key),
      player: leaders.value[key]!.player,
      displayValue: formatValue(key, leaders.value[key]!.value)
    }))
    .filter(Boolean) as Array<{ key: string; label: string; player: TeamLeader['player']; displayValue: string }>
})

const pitchingRows = computed(() => {
  const order = ['strikeouts', 'earnedRunAverage'] as const
  return order
    .map((key) => leaders.value[key] && ({
      key,
      label: labelFor(key),
      player: leaders.value[key]!.player,
      displayValue: formatValue(key, leaders.value[key]!.value)
    }))
    .filter(Boolean) as Array<{ key: string; label: string; player: TeamLeader['player']; displayValue: string }>
})

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase()
}
function emitPlayer(id: number) {
  emit('select-player', id)
}
</script>

<style scoped>
.tabular-nums { font-variant-numeric: tabular-nums; }
</style>
