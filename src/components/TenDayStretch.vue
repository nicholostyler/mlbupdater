<template>
  <!-- Container-aligned like the rest of the page -->
  <section class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
    <!-- Header: title left, button right -->
    <header class="relative z-20 mb-2 flex items-center justify-between gap-3 flex-nowrap min-w-0">
      <h2 class="truncate text-lg font-semibold tracking-tight">10-Day Stretch</h2>
      <Button
        class="shrink-0"
        label="Season Schedule"
        icon="pi pi-calendar"
        iconPos="left"
        size="small"
        severity="secondary"
        text
        @click="$emit('go-schedule')"
        aria-label="Open full season schedule"
      />
    </header>

    <div v-if="loading" class="flex items-center gap-2 text-gray-500">
      <i class="pi pi-spin pi-spinner" /> Loading…
    </div>
    <div v-else-if="cards.length === 0" class="text-gray-500">No games in this period.</div>

    <!-- Full-bleed scroller (Option A: dvw so it doesn't exceed viewport with scrollbar) -->
    <div class="relative z-0">
      <div class="relative overflow-hidden w-[100dvw] ml-[calc(50%-50dvw)] mr-[calc(50%-50dvw)]">
        <!-- Desktop chevrons -->
        <Button
          class="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10"
          icon="pi pi-chevron-left"
          rounded
          text
          aria-label="Scroll left"
          @click="scrollDir(-1)"
        />
        <Button
          class="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10"
          icon="pi pi-chevron-right"
          rounded
          text
          aria-label="Scroll right"
          @click="scrollDir(1)"
        />

        <!-- Fade edges on mobile to hint scrollability -->
        <div class="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white/90 to-transparent md:hidden z-0" />
        <div class="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white/90 to-transparent md:hidden z-0" />

        <!-- Horizontal list -->
        <div
          ref="scroller"
          class="scroller flex flex-nowrap snap-x snap-mandatory gap-3
                 overflow-x-auto overscroll-x-contain touch-pan-x scroll-smooth
                 px-4 sm:px-6 lg:px-8 pb-2 w-full min-w-0 [scrollbar-gutter:stable]"
          role="list"
          tabindex="0"
          aria-label="Upcoming games"
          @wheel="onHorizWheel"
        >
          <!-- Card: keep your existing design/content -->
          <article
            v-for="item in cards"
            :key="item.gamePk"
            class="flex-none shrink-0 basis-[88%] sm:basis-[72%] md:basis-[48%] lg:basis-[32%] snap-start"
            role="listitem"
          >
            <Card
              class="rounded-2xl overflow-hidden h-full"
              :class="{ 'ring-2 ring-primary-200': item.state === 'In Progress' }"
              @click="open(item.gamePk)"
            >
              <template #content>
                <div class="grid grid-cols-[1fr_1.2fr_auto] items-center gap-3">
                  <div>
                    <div class="font-semibold text-sm">{{ item.dateText }}</div>
                  </div>

                  <div>
                    <div class="font-semibold text-base">{{ item.matchup }}</div>
                    <div class="text-gray-500 text-sm">{{ item.venue }}</div>
                  </div>

                  <div class="text-right">
                    <div class="font-bold text-lg">
                      <span v-if="item.scoreText">{{ item.scoreText }}</span>
                      <span v-else>—</span>
                    </div>
                    <div
                      class="text-sm mt-0.5"
                      :class="{
                        'text-emerald-700': item.result === 'Win',
                        'text-red-700': item.result === 'Loss',
                        'text-gray-500': !item.result || item.result === 'Tie'
                      }"
                    >
                      {{ item.result || item.state }}
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>



<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import { useTeam } from '@/composables/useTeam';
import { fetchTeamSchedule, todayYYYYMMDD, addDays, type ScheduleGame } from '@/services/mlb';
import { TeamHelpers } from '@/utils/TeamHelpers';

const emit = defineEmits<{ (e: 'go-schedule'): void }>();

const { favorite } = useTeam();
const loading = ref(true);
const games = ref<ScheduleGame[]>([]);

const viewport = ref<HTMLElement | null>(null);
const scroller = ref<HTMLElement | null>(null);

const today = todayYYYYMMDD();
const start = addDays(today, -5);
const end = addDays(today, 5);
const router = useRouter();

function open(gamePk: number) {
  if (gamePk) router.push({ name: 'game-detail', params: { gamePk } });
}

function openSchedule() {
  const favoriteTeamNumber = favorite.value!.id;
  if (favoriteTeamNumber) router.push({ name: 'team-schedule', params: { teamId: favoriteTeamNumber } });
}

function fmtDateLong(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function abbr(team: { name: string; abbreviation?: string }): string {
  return team.abbreviation || TeamHelpers.abbreviateTeamName(team.name);
}

type CardVM = {
  gamePk: number;
  dateText: string;
  matchup: string;
  venue: string;
  scoreText: string | null;
  result: 'Win' | 'Loss' | 'Tie' | '';
  state: string;
};

const cards = computed<CardVM[]>(() => {
  const youId = favorite.value!.id;

  return games.value.map((g) => {
    const home = g.teams.home.team;
    const away = g.teams.away.team;
    const homeAbbr = abbr(home);
    const awayAbbr = abbr(away);

    const yourName = favorite.value!.name;
    const matchup = TeamHelpers.abbreviateMatchup(home.name, away.name, yourName)
      .replace(home.name, homeAbbr)
      .replace(away.name, awayAbbr);

    const isFinal = g.status.detailedState?.startsWith('Final');
    const isLive = g.status.abstractGameState === 'Live';
    const state = (isFinal && 'Final') || (isLive && 'In Progress') || g.status.detailedState || '—';

    const homeScore = g.teams.home.score ?? null;
    const awayScore = g.teams.away.score ?? null;

    let yourScore: number | null = null;
    let oppScore: number | null = null;
    const yourHome = home.id === youId;

    if (homeScore != null && awayScore != null) {
      yourScore = yourHome ? homeScore : awayScore;
      oppScore = yourHome ? awayScore : homeScore;
    }

    let result: CardVM['result'] = '';
    if (yourScore != null && oppScore != null) {
      if (yourScore > oppScore) result = 'Win';
      else if (yourScore < oppScore) result = 'Loss';
      else result = 'Tie';
    }

    const scoreText = yourScore != null && oppScore != null ? `${yourScore} - ${oppScore}` : null;

    return {
      gamePk: g.gamePk,
      dateText: fmtDateLong(g.gameDate),
      matchup,
      venue: g.venue?.name ?? '',
      scoreText,
      result,
      state,
    };
  });
});

function clampScroll() {
  const el = scroller.value;
  if (!el) return;
  const max = Math.max(el.scrollWidth - el.clientWidth, 0);
  if (el.scrollLeft > max) el.scrollLeft = max;
}

onMounted(async () => {
  loading.value = true;
  games.value = await fetchTeamSchedule(favorite.value!.id, start, end);
  loading.value = false;

  // Clamp after layout changes (viewport shrink/expand).
  window.addEventListener('resize', clampScroll);
  window.addEventListener('orientationchange', clampScroll);

  // Snap the first upcoming game into view
  requestAnimationFrame(() => {
    const el = scroller.value;
    if (!el) return;
    const idx = games.value.findIndex((g) => new Date(g.gameDate) >= new Date(today));
    const target = el.children.item(Math.max(0, idx));
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', clampScroll);
  window.removeEventListener('orientationchange', clampScroll);
});

function scrollDir(dir: number) {
  const el = scroller.value;
  if (!el) return;
  el.scrollBy({
    left: dir * Math.max(320, Math.round(el.clientWidth * 0.9)),
    behavior: 'smooth'
  });
}
</script>

<style scoped>
/* Optional: nicer horizontal scrollbar */
:where([ref="scroller"])::-webkit-scrollbar { height: 8px; }
:where([ref="scroller"])::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,.2);
  border-radius: 8px;
}
</style>
