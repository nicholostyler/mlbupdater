<template>
  <Card class="score-card cursor-pointer" @click="open">
    <template #content>
      <div v-if="loading" class="row-center gap-2">
        <i class="pi pi-spin pi-spinner" /> Loading...
      </div>

      <div v-else-if="!game" class="row-center text-muted-color">No Game</div>

      <div v-else>
        <!-- Banner -->
        <div class="banner row-center">
          <i
            v-if="!isGameOver && isLive"
            :class="['pi', isTopInning ? 'pi-arrow-up' : 'pi-arrow-down']"
          />
          <span class="banner-text">
            {{ bannerText }}
          </span>
        </div>

        <!-- Scores -->
        <div class="scores row-between">
          <div class="teamcol" :class="{ active: isLive && isTopInning && !isGameOver }">
            <div class="team">{{ awayTeamName }}</div>
            <div class="score" :class="{ bold: isLive && isTopInning && !isGameOver }">
              {{ awayScoreDisplay }}
            </div>
          </div>

          <div class="vs">vs</div>

          <div class="teamcol" :class="{ active: isLive && !isTopInning && !isGameOver }">
            <div class="team team--accent">{{ homeTeamName }}</div>
            <div class="score score--accent" :class="{ bold: isLive && !isTopInning && !isGameOver }">
              {{ homeScoreDisplay }}
            </div>
          </div>
        </div>

        <!-- Details (live only) -->
        <div v-if="isLive" class="row-center details">
          <span>{{ outsText }}</span>
          <span v-if="leftOnBaseText">•</span>
          <span v-if="leftOnBaseText">{{ leftOnBaseText }}</span>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import Card from 'primevue/card';
import { useTeam } from '@/composables/useTeam';
import { fetchTodaysTeamGame, fetchLiveGame, todayYYYYMMDD, type ScheduleGame } from '@/services/mlb';
import { useRouter } from 'vue-router';

type LinescoreTeams = {
  away?: { runs?: number };
  home?: { runs?: number };
};
type LiveLinescore = {
  teams?: LinescoreTeams;
  currentInning?: number;
  isTopInning?: boolean;
  outs?: number;
  offense?: { leftOnBase?: number };
};
type LiveFeed = {
  gameData?: { status?: { abstractGameState?: string; detailedState?: string } };
  liveData?: { linescore?: LiveLinescore };
};

//const emit = defineEmits<{ (e: 'open-game', gamePk: number): void }>();

const { favorite } = useTeam();
const loading = ref(true);
const game = ref<ScheduleGame | null>(null);
const live = ref<LiveFeed | null>(null);
const router = useRouter();

function ordinal(n?: number): string {
  if (!n && n !== 0) return '';
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

const statusFromSchedule = computed(() => game.value?.status?.detailedState);
const statusFromLive = computed(() => live.value?.gameData?.status?.detailedState);
const abstractState = computed(
  () => game.value?.status?.abstractGameState ?? live.value?.gameData?.status?.abstractGameState
);

const linescore = computed(() => live.value?.liveData?.linescore);
const isTopInning = computed(() => !!linescore.value?.isTopInning);
const inning = computed(() => linescore.value?.currentInning);
const isLive = computed(() => abstractState.value === 'Live' || statusFromLive.value === 'In Progress');
const isGameOver = computed(() => abstractState.value === 'Final' || statusFromLive.value === 'Final');

const bannerText = computed(() => {
  if (isGameOver.value) return 'Final';
  if (isLive.value && inning.value) return `${isTopInning.value ? 'Top' : 'Bot'} ${ordinal(inning.value)}`;
  return statusFromSchedule.value || statusFromLive.value || 'No Game';
});

const awayTeamName = computed(() => game.value?.teams.away.team.name ?? '');
const homeTeamName = computed(() => game.value?.teams.home.team.name ?? '');

const awayScore = computed<number | undefined>(
  () => linescore.value?.teams?.away?.runs ?? game.value?.teams.away.score
);
const homeScore = computed<number | undefined>(
  () => linescore.value?.teams?.home?.runs ?? game.value?.teams.home.score
);
const awayScoreDisplay = computed(() => awayScore.value ?? 0);
const homeScoreDisplay = computed(() => homeScore.value ?? 0);

const outs = computed(() => linescore.value?.outs ?? 0);
const outsText = computed(() => `${outs.value} Out${outs.value === 1 ? '' : 's'}`);
const leftOnBase = computed(() => linescore.value?.offense?.leftOnBase);
const leftOnBaseText = computed(() => (leftOnBase.value != null ? String(leftOnBase.value) : ''));

async function load() {
  loading.value = true;
  const date = todayYYYYMMDD();
  game.value = await fetchTodaysTeamGame(favorite.value!.id, date);
  if (game.value?.gamePk) {
    try { live.value = await fetchLiveGame(game.value.gamePk) as LiveFeed; } catch {/* non-fatal */}
  }
  loading.value = false;
}

function open() {
  if (game.value?.gamePk)
    router.push({ name: 'game-detail', params: { gamePk: game.value.gamePk } });
}

onMounted(load);

// Poll during live
let timer: number | undefined;
watch(abstractState, (s) => {
  if (timer) window.clearInterval(timer);
  if (s === 'Live') {
    timer = window.setInterval(async () => {
      if (game.value?.gamePk) {
        try { live.value = await fetchLiveGame(game.value.gamePk) as LiveFeed; } catch {}
      }
    }, 30000);
  }
});
onUnmounted(() => { if (timer) window.clearInterval(timer); });
</script>

<style scoped>
/* Layout helpers */
.row-center { display: flex; align-items: center; justify-content: center; }
.row-between { display: flex; align-items: center; justify-content: space-evenly; }
.text-muted { color: var(--p-text-muted-color); }

/* Card look (rounded, subtle) */
/*.score-card :deep(.p-card) { border-radius: 16px; }
.score-card :deep(.p-card-content) { padding: 1rem 1.25rem; }*/

/* Banner (e.g., "↓ Bot 3rd") */
.banner { gap: .5rem; margin-bottom: .5rem; }
.banner .pi { font-size: 1rem; color: var(--p-primary-color); }
.banner-text { font-weight: 700; font-size: 1.1rem; }

/* Score row */
.scores { gap: 1rem; margin: .25rem 0; }
.teamcol { display: grid; grid-template-columns: 1fr; justify-items: center; gap: .25rem; min-width: 120px; }
.team { font-size: .95rem; color: var(--text-color); }
.team--accent { color: var(--p-primary-700, #3b82f6); font-weight: 600; }
.score { font-size: 2rem; font-weight: 600; line-height: 1; }
.score--accent { color: var(--p-primary-700, #3b82f6); }
.bold { font-weight: 800; }
.vs { font-size: .9rem; color: var(--text-color-secondary); }

/* Bottom details */
.details { gap: .5rem; color: var(--text-color); font-size: .9rem; opacity: .9; }
</style>
