<template>
  <!-- Card layout for mobile -->
  <div class="md:hidden grid gap-3 list-none p-0 m-0">
    <li v-for="game in games" :key="game.gamePk">
      <ScheduleCard :game="game" :teamId="favorite?.id"/>
    </li>
  </div>
  <!-- Desktop table -->
  <div class="hidden md:block">
    <DataTable :value="tableRows" table-style="min-width: 50rem" @rowClick="onRowClick">
      <Column field="gameDateLabel" header="Date"/>
      <Column field="awayTeamLabel" header="Away"/>
      <Column field="homeTeamLabel" header="Home"/>
      <Column field="state" header="Status"/>
    </DataTable>
  </div>

</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import Card from 'primevue/card';
import ScheduleCard from '@/components/ScheduleCard.vue'
import Tag from 'primevue/tag';
import { useTeam } from '@/composables/useTeam';
import { fetchTeamSchedule } from '@/services/mlb';
import { type ScheduleGame, toTableVM } from '@/data/models/ScheduleGame.ts'
import { useRouter } from 'vue-router';
import { TeamHelpers } from '@/utils/TeamHelpers';




import DataTable from 'primevue/datatable';
import Column from 'primevue/column';



const { favorite } = useTeam();
const loading = ref(true);
const games = ref<ScheduleGame[]>([]);
const year = new Date().getFullYear();
const start = `${year}-03-01`;
const end = `${year}-11-30`;
const router = useRouter();

function abbr(team: { name: string; abbreviation?: string }): string {
  return team.abbreviation || TeamHelpers.abbreviateTeamName(team.name);
}

function fmtDateLong(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

const tableRows = computed(() => games.value.map(g => {
  return toTableVM(g, favorite.value?.id)
}))

onMounted(async () => {
  games.value = await fetchTeamSchedule(favorite.value!.id, start, end);

  loading.value = false;
});

function onRowClick(e: any) {
  const gamePk = e.data.gamePk;
  if (gamePk)
    router.push({ name: 'game-detail', params: { gamePk: gamePk } });
}
</script>

<style>
/* Card appearance close to your mock */
.gcard {
  min-width: 380px;
  scroll-snap-align: start;
  border-radius: 16px;
}
.gcard-root { border-radius: 16px; }
.gcard-content {
  background: var(--p-surface-100);
  border-radius: 16px;
  padding: 12px 16px;
}

/* Grid inside each card: left (date), mid (matchup+venue), right (score+result) */
.ggrid {
  display: grid;
  grid-template-columns: 1fr 1.2fr auto;
  align-items: center;
  gap: 10px;
}
.gcol-left .date {
  font-weight: 600;
  color: var(--p-text-color);
}
.gcol-mid .matchup {
  font-weight: 700;
  font-size: 1rem;
  color: var(--p-text-color);
}
.gcol-mid .venue {
  margin-top: 2px;
  font-size: .9rem;
  color: var(--p-text-muted-color, #6b7280);
}
.gcol-right {
  text-align: right;
}
.score {
  font-size: 1.25rem;
  font-weight: 700;
}
.result {
  font-size: .95rem;
  margin-top: 2px;
}
.result.win { color: #15803d; }   /* Tailwind-ish green-700 */
.result.loss { color: #b91c1c; }  /* red-700 */
.result.tie { color: var(--p-text-muted-color, #6b7280); }
.result.muted { color: var(--p-text-muted-color, #6b7280); }

/* Optional: subtle live highlight */
.gcard.live .gcard-content {
  box-shadow: 0 0 0 2px var(--p-primary-100, rgba(59,130,246,.25)) inset;
}
</style>
