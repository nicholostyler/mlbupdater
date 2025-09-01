<template>
  <main class="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
    <Card>
      <template #title>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <Button text severity="secondary" icon="pi pi-arrow-left" @click="goBack" />
            <span class="text-lg font-semibold">Player Details</span>
          </div>
          <div class="text-sm text-muted-color" v-if="info">
            <span>{{ info.currentTeam?.name }}</span>
          </div>
        </div>
      </template>

      <template #content>
        <div v-if="loading" class="h-40 flex items-center justify-center text-muted-color gap-2">
          <i class="pi pi-spin pi-spinner"></i> Loading…
        </div>

        <div v-else-if="!info" class="h-40 flex items-center justify-center text-muted-color">
          No Player
        </div>

        <div v-else class="space-y-8">
          <!-- Hero -->
          <div class="flex flex-wrap items-center gap-4">
            <Avatar
              :image="headshotUrl"
              shape="circle"
              size="xlarge"
              :pt="{
    root: {
      // make it square and a touch bigger so less is cropped
      style: {
        '--p-avatar-xl-width': '100px',
        '--p-avatar-xl-height': '100px',
        'aspect-ratio': '1'
      }
    },
    image: {
      // fill container, but bias crop upward to show more head
      class: 'object-cover',
      style: { objectPosition: 'center 30%' } // try 0–10%; smaller = more hat
    }
  }"
            />




            <div class="min-w-0">
              <div class="text-2xl font-semibold leading-tight truncate">{{ info.fullName }}</div>
              <div class="text-sm text-color-secondary">
                <span v-if="info.primaryNumber">#{{ info.primaryNumber }}</span>
                <span v-if="info.primaryPosition?.abbreviation"> • {{ info.primaryPosition?.abbreviation }}</span>
                <span v-if="info.currentTeam?.name"> • {{ info.currentTeam?.name }}</span>
              </div>
            </div>

            <div class="ml-auto grid grid-cols-3 gap-3 text-center">
              <div class="px-3 py-2 rounded-xl border border-surface-200">
                <div class="text-xs text-color-secondary">Bats</div>
                <div class="text-lg font-semibold">{{ info.batSide?.code ?? '—' }}</div>
              </div>
              <div class="px-3 py-2 rounded-xl border border-surface-200">
                <div class="text-xs text-color-secondary">Throws</div>
                <div class="text-lg font-semibold">{{ info.pitchHand?.code ?? '—' }}</div>
              </div>
              <div class="px-3 py-2 rounded-xl border border-surface-200">
                <div class="text-xs text-color-secondary">Age</div>
                <div class="text-lg font-semibold">{{ info.currentAge ?? '—' }}</div>
              </div>
            </div>
          </div>

          <!-- Bio -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div class="rounded-xl border border-surface-200 p-3">
              <div class="text-xs text-color-secondary">Height</div>
              <div class="font-medium">{{ info.height ?? '—' }}</div>
            </div>
            <div class="rounded-xl border border-surface-200 p-3">
              <div class="text-xs text-color-secondary">Weight</div>
              <div class="font-medium">{{ info.weight ? info.weight + ' lb' : '—' }}</div>
            </div>
            <div class="rounded-xl border border-surface-200 p-3">
              <div class="text-xs text-color-secondary">Born</div>
              <div class="font-medium">{{ dateOnly(info.birthDate) }}</div>
            </div>
            <div class="rounded-xl border border-surface-200 p-3">
              <div class="text-xs text-color-secondary">Debut</div>
              <div class="font-medium">{{ dateOnly(info.mlbDebutDate) }}</div>
            </div>
            <div class="rounded-xl border border-surface-200 p-3">
              <div class="text-xs text-color-secondary">Position</div>
              <div class="font-medium">{{ info.primaryPosition?.name ?? '—' }}</div>
            </div>
            <div class="rounded-xl border border-surface-200 p-3">
              <div class="text-xs text-color-secondary">Team</div>
              <div class="font-medium">{{ info.currentTeam?.name ?? '—' }}</div>
            </div>
          </div>
          <!-- Season splits table (PrimeVue DataTable) -->
          <div class="flex items-center justify-between gap-3">
            <div class="text-sm text-color-secondary">Season Splits</div>
            <SelectButton v-if="hasToggle" v-model="activeGroup" :options="groupOptions" optionLabel="label" optionValue="value" />
          </div>

          <DataTable :value="activeSplits" dataKey="season" class="w-full" size="small" scrollable scrollHeight="flex" v-if="activeSplits?.length">
            <Column v-for="col in columns" :key="col.key" :field="col.field" :header="col.header" :style="col.style" :body="col.body" />
          </DataTable>
          <div v-else class="h-24 flex items-center justify-center text-muted-color">No stats</div>

        </div>


      </template>
    </Card>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import SelectButton from 'primevue/selectbutton';

import { fetchPlayerInfo, fetchPlayerSeasonStatsCombined } from '@/services/mlb';
import type { PlayerInfo, PlayerSeasonStats } from '../data/models/Player.ts';

const route = useRoute();
const router = useRouter();
const playerId = computed(() => Number(route.params.playerId));

const loading = ref(true);
const info = ref<PlayerInfo | null>(null);
const seasonStats = ref<PlayerSeasonStats | null>(null);

const headshotUrl = computed(() =>
  info.value?.id
    ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_100,f_jpg/v1/people/${info.value.id}/headshot/67/current`
    : ''
);

const activeGroup = ref<'hitting'|'pitching'>('hitting');
const groupOptions = [
  { label: 'Hitting', value: 'hitting' },
  { label: 'Pitching', value: 'pitching' }
] as const;


const availableGroups = computed(() =>
  (['hitting','pitching'] as const).filter(g => !!seasonStats.value?.[g]?.splits?.length)
);
const hasToggle = computed(() => availableGroups.value.length > 1);
const effectiveGroup = computed(() =>
  (availableGroups.value.includes(activeGroup.value) ? activeGroup.value : availableGroups.value[0]) as 'hitting' | 'pitching'
);
const activeSplits = computed(() =>
  effectiveGroup.value && seasonStats.value ? seasonStats.value[effectiveGroup.value]?.splits ?? [] : []
);


// Column definitions for both groups
const hittingColumns = [
  { key: 'season', field: 'season', header: 'Season', style: 'width: 6rem' },
  { key: 'team', field: 'team.name', header: 'Team' },
  { key: 'games', field: 'stat.games', header: 'G', style: 'width: 4rem' },
  { key: 'pa', field: 'stat.plateAppearances', header: 'PA', style: 'width: 4rem' },
  { key: 'ab', field: 'stat.atBats', header: 'AB', style: 'width: 4rem' },
  { key: 'r', field: 'stat.runs', header: 'R', style: 'width: 4rem' },
  { key: 'h', field: 'stat.hits', header: 'H', style: 'width: 4rem' },
  { key: 'hr', field: 'stat.homeRuns', header: 'HR', style: 'width: 4rem' },
  { key: 'rbi', field: 'stat.rbi', header: 'RBI', style: 'width: 4rem' },
  { key: 'bb', field: 'stat.baseOnBalls', header: 'BB', style: 'width: 4rem' },
  { key: 'so', field: 'stat.strikeOuts', header: 'SO', style: 'width: 4rem' },
  { key: 'avg', field: 'stat.avg', header: 'AVG', style: 'width: 5rem' },
  { key: 'obp', field: 'stat.obp', header: 'OBP', style: 'width: 5rem' },
  { key: 'slg', field: 'stat.slg', header: 'SLG', style: 'width: 5rem' },
  { key: 'ops', field: 'stat.ops', header: 'OPS', style: 'width: 5rem' }
];

const pitchingColumns = [
  { key: 'season', field: 'season', header: 'Season', style: 'width: 6rem' },
  { key: 'team', field: 'team.name', header: 'Team' },
  { key: 'g', field: 'stat.games', header: 'G', style: 'width: 4rem' },
  { key: 'gs', field: 'stat.gamesStarted', header: 'GS', style: 'width: 4rem' },
  { key: 'ip', field: 'stat.inningsPitched', header: 'IP', style: 'width: 4rem' },
  { key: 'w', field: 'stat.wins', header: 'W', style: 'width: 4rem' },
  { key: 'l', field: 'stat.losses', header: 'L', style: 'width: 4rem' },
  { key: 'era', field: 'stat.era', header: 'ERA', style: 'width: 5rem' },
  { key: 'so', field: 'stat.strikeOuts', header: 'SO', style: 'width: 4rem' },
  { key: 'bb', field: 'stat.baseOnBalls', header: 'BB', style: 'width: 4rem' },
  { key: 'whip', field: 'stat.whip', header: 'WHIP', style: 'width: 5rem' },
  { key: 'fip', field: 'stat.pitchingFiP', header: 'FIP', style: 'width: 5rem' }
];

const columns = computed(() => activeGroup.value === 'hitting' ? hittingColumns : pitchingColumns);


function dateOnly(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
}

function goBack() {
  if (history.length > 1) router.back();
  else router.push({ name: 'home' });
}

function stat(group: 'hitting'|'pitching', key: string) {
  const s = seasonStats.value?.[group]?.splits?.[0]?.stat as any;
  return s?.[key] ?? '—';
}

async function load() {
  loading.value = true;
  const year = String(new Date().getFullYear());
  try {
    const [pi, st] = await Promise.all([
      fetchPlayerInfo(playerId.value),
      fetchPlayerSeasonStatsCombined(playerId.value, year)
    ]);
    info.value = pi;
    seasonStats.value = st;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(playerId, load);
</script>

<style scoped>
.text-muted-color { color: var(--text-color-secondary); }
</style>
