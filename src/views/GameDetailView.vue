<template>
  <main class="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <Button text severity="secondary" icon="pi pi-arrow-left" @click="goBack" />
            <span class="text-lg font-semibold">Game Details</span>
          </div>

          <div class="flex items-center gap-3 text-sm text-muted-color">
            <i v-if="isLive" class="pi pi-bolt"></i>
            <span>{{ bannerText }}</span>
          </div>
        </div>
      </template>

      <template #content>
        <!-- Loading / Empty states -->
        <div v-if="loading" class="h-40 flex items-center justify-center text-muted-color gap-2">
          <i class="pi pi-spin pi-spinner"></i> Loading…
        </div>
        <div v-else-if="!game" class="h-40 flex items-center justify-center text-muted-color">
          No Game
        </div>

        <div v-else class="space-y-6">
          <!-- Scoreboard summary -->
          <div class="flex items-center justify-center gap-10 py-3">
            <div class="grid grid-cols-1 justify-items-center gap-1 min-w-28">
              <span class="text-sm text-color-secondary">{{ awayTeamName }}</span>
              <span class="text-3xl font-semibold" :class="{'text-primary-600': isAwayLeading}">{{ awayScore ?? '—' }}</span>
            </div>

            <div class="grid grid-cols-1 justify-items-center gap-1">
              <span class="text-sm text-color-secondary">
                {{ venueName }} <span v-if="gameTimeTz">• {{ gameTimeTz }}</span>
              </span>
              <span class="text-base font-medium">{{ bannerText }}</span>
            </div>

            <div class="grid grid-cols-1 justify-items-center gap-1 min-w-28">
              <span class="text-sm text-color-secondary">{{ homeTeamName }}</span>
              <span class="text-3xl font-semibold" :class="{'text-primary-600': isHomeLeading}">{{ homeScore ?? '—' }}</span>
            </div>
          </div>

          <Divider class="my-1" />

          <!-- Play-by-Play (grouped by inning) -->
          <div v-if="grouped.length" class="space-y-6">
            <div v-for="section in grouped" :key="section.key" class="space-y-3">
              <div class="flex items-center gap-2 ">
                <Tag  :value="section.label" severity="secondary" />
                <span class="text-sm text-color-secondary">{{ section.summary }}</span>

              </div>

              <ul class="divide-y divide-surface-200 rounded-xl border border-surface-200 overflow-hidden">
                <li v-for="play in section.plays" :key="play.id" class="flex items-start gap-3 p-3">
                  <Avatar
                    :image="play.imageUrl"
                    shape="circle"
                    size="large"
                    :pt="{ image: { class: 'bg-surface-200' } }"
                    class="shrink-0"
                    @click="play.batterId && open(Number(play.batterId))"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="text-sm leading-5">
                      {{ play.desc }}
                    </div>
                    <div class="mt-1 text-xs text-color-secondary flex items-center gap-3">
                      <span v-if="play.count">{{ play.count }}</span>
                      <span v-if="play.runners">{{ play.runners }}</span>
                      <span v-if="play.pitch">{{ play.pitch }}</span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div v-else class="h-24 flex items-center justify-center text-muted-color">
            Game has not happened yet
          </div>
        </div>
      </template>
    </Card>
  </main>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';

import type { LiveGame, Play } from '../data/models/game-details.ts';

import { fetchLiveGame } from '@/services/mlb';

const route = useRoute();
const router = useRouter();
const gamePk = computed<number>(() => Number(route.params.gamePk));

const loading = ref(true);
const live = ref<LiveGame | null>(null);
const pollId = ref<number | null>(null);

function goBack() {
  if (history.length > 1) router.back();
  else router.push({ name: 'home' });
}

async function load() {
  loading.value = true;
  try {
    const data = await fetchLiveGame(gamePk.value);
    live.value = data ?? null;
  } finally {
    loading.value = false;
  }
}

// Lightweight polling while live
function startPolling() {
  stopPolling();
  pollId.value = window.setInterval(async () => {
    if (!isLive.value) return stopPolling();
    try {
      const data = await fetchLiveGame(gamePk.value);
      live.value = data ?? live.value;
    } catch {/* ignore */}
  }, 10_000);
}
function stopPolling() {
  if (pollId.value) {
    clearInterval(pollId.value);
    pollId.value = null;
  }
}

function open(playerId: number) {
  if (playerId)
    router.push({ name: 'player-detail', params: { playerId: playerId } });
}

onMounted(load);
watch(gamePk, load);
onMounted(startPolling);
onUnmounted(stopPolling);

/** --------- computed helpers ---------- */
const game = computed(() => live.value?.gameData?.game ?? null);


// status / banner
const abstractState = computed(() => live.value?.gameData?.status?.abstractGameState ?? '');
const detailedState = computed(() => live.value?.gameData?.status?.detailedState ?? '');
const isLive = computed(() => abstractState.value === 'Live');
const isFinal = computed(() => abstractState.value === 'Final' || detailedState.value === 'Final');
const bannerText = computed(() => {
  const linescore = live.value?.liveData?.linescore;
  if (isFinal.value) return 'Final';
  if (isLive.value && linescore?.currentInning) {
    const half = linescore?.isTopInning ? 'Top' : 'Bot';
    return `${half} ${ordinal(linescore.currentInning)}`;
  }
  return detailedState.value || abstractState.value || '—';
});

// teams / venue / time
const venueName = computed(() => live.value?.gameData?.venue?.name ?? '');
const gameTimeTz = computed(() => live.value?.gameData?.datetime?.time ?? '');
const awayTeamName = computed(() => live.value?.gameData?.teams?.away?.name ?? '');
const homeTeamName = computed(() => live.value?.gameData?.teams?.home?.name ?? '');

// scores
const awayScore = computed<number | undefined>(() =>
  live.value?.liveData?.linescore?.teams?.away?.runs ?? live.value?.gameData?.teams?.away?.score
);
const homeScore = computed<number | undefined>(() =>
  live.value?.liveData?.linescore?.teams?.home?.runs ?? live.value?.gameData?.teams?.home?.score
);
const isAwayLeading = computed(() =>
  (awayScore.value ?? -1) > (homeScore.value ?? -1)
);
const isHomeLeading = computed(() =>
  (homeScore.value ?? -1) > (awayScore.value ?? -1)
);

// plays grouped by inning+half
type PlayRow = {
  id: string;
  desc: string;
  imageUrl: string;
  count?: string;
  runners?: string;
  pitch?: string;
  batterId?: number;
};
type InningSection = { key: string; label: string; summary?: string; plays: PlayRow[] };

const grouped = computed<InningSection[]>(() => {
  const all = live.value?.liveData?.plays?.allPlays ?? [];
  if (!all.length) return [];

  // group
  const groups = new Map<string, PlayRow[]>();
  for (const p of all) {
    const inning = p.about?.inning;
    const top = p.about?.isTopInning ? 'Top' : 'Bottom';
    if (!inning) continue;

    const key = `${inning}-${top}`;
    const arr = groups.get(key) ?? [];
    const batterId = p.matchup?.batter?.id;

    const head = batterId
      ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,q_100,f_jpg/v1/people/${batterId}/headshot/67/current`
      : `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/0/headshot/67/current`;

    const balls = p.count?.balls ?? 0;
    const strikes = p.count?.strikes ?? 0;
    const outs = p.count?.outs ?? 0;

    arr.push({
      id: String(p.playId ?? p.endTime ?? `${inning}-${top}-${arr.length}`),
      desc: p.result?.description ?? 'No description',
      imageUrl: head,
      count: `Count: ${balls}-${strikes}, Outs: ${outs}`,
      runners: runnersText(p),
      pitch: pitchText(p),
      batterId: batterId
    });
    groups.set(key, arr);
  }

  // order by inning asc, top first
  const sections: InningSection[] = [];
  const sortHalf = (k: string) => (k.endsWith('Top') ? 0 : 1);
  const keys = Array.from(groups.keys()).sort((a, b) => {
    const [ia, ha] = a.split('-'); const [ib, hb] = b.split('-');
    if (Number(ia) !== Number(ib)) return Number(ia) - Number(ib);
    return sortHalf(ha) - sortHalf(hb);
  });

  for (const k of keys) {
    const [inning, half] = k.split('-');
    sections.push({
      key: k,
      label: `Inning ${inning} – ${half}`,
      summary: `${groups.get(k)?.length ?? 0} plays`,
      plays: groups.get(k) ?? []
    });
  }
  return sections;
});

/** ------------ helpers ------------- */
function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function runnersText(p: any): string | undefined {
  const r = p.runners || p.runnersScored || p.runner || null;
  if (!r) return;
  try {
    const moves = (p.runners || []).map((m: any) => m.movement?.end || m.movement?.start).filter(Boolean);
    if (moves.length) return `Runners: ${moves.join(', ')}`;
  } catch {}
}
function pitchText(p: any): string | undefined {
  const dt = p?.details; if (!dt) return;
  const ev = dt?.event || dt?.type || null;
  const sp = dt?.description || dt?.call?.description || null;
  return [ev, sp].filter(Boolean).join(' – ');
}
</script>

<style scoped>
.text-muted-color { color: var(--text-color-secondary); }

</style>
