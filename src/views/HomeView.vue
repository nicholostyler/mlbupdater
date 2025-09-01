<template>
  <div class="grid gap-6 sm:gap-8 lg:gap-10">
    <section class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
      <Scoreboard class="w-full" />
    </section>

    <section class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
      <TenDayStretch class="w-full" @go-schedule="goSchedule" />
    </section>

    <section>
      <div class="grid gap-6 lg:gap-8 lg:grid-cols-2">
        <DivisionStanding :team-id="favTeamId" class="min-w-0" />
        <TeamMVPs class="min-w-0" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const { favorite } = useTeam();
import Scoreboard from '@/components/Scoreboard.vue';
import TenDayStretch from '@/components/TenDayStretch.vue';
import DivisionStanding from '@/components/DivisionStanding.vue';
import TeamMVPs from '@/components/TeamMVPs.vue';
import { useTeam } from '@/composables/useTeam.ts'
const router = useRouter();

const favTeamId = favorite.value?.id ?? 143;
function goSchedule() { router.push({ name: 'schedule' }); }


</script>

<style scoped>

</style>
