<template>
  <header class="mb-2 flex items-center justify-between">
    <h2 class="text-lg font-semibold tracking-tight">
      10-Day Stretch
    </h2>
    <div class="text-sm text-gray-500">
      <router-link
        :to="{ name: 'team-schedule', params: { teamId: favoriteTeamNumber } }"
        class="text-sm text-blue-600 hover:underline cursor-pointer"
      >
        View Schedule
      </router-link>
    </div>
  </header>
  <div
    ref="scroller"
    class="w-full overflow-x-auto overflow-y-hidden touch-pan-x snap-x snap-mandatory" >
    <ul
      class="inline-flex w-max gap-4 p-4"
    >
      <li
        v-for="item in games"
        :key="item.gamePk"
        class="snap-start shrink-0 min-w-[20rem]">
        <ScheduleCard :game="item" :teamId="favorite?.id"/>
      </li>

    </ul>
  </div>

</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, nextTick } from 'vue'
import Card from 'primevue/card';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import { useTeam } from '@/composables/useTeam';
import { fetchTeamSchedule, todayYYYYMMDD, addDays } from '@/services/mlb';
import { TeamHelpers } from '@/utils/TeamHelpers';
import Carousel from 'primevue/carousel';
import ScheduleCard from '@/components/ScheduleCard.vue'

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


const favoriteTeamNumber = favorite.value!.id;


function openSchedule() {

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

function clampScroll() {
  const el = scroller.value;
  if (!el) return;
  const max = Math.max(el.scrollWidth - el.clientWidth, 0);
  if (el.scrollLeft > max) el.scrollLeft = max;
}



onMounted(async () => {
  console.log()
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

</style>
