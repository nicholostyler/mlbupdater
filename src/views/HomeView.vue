<template>
  <div class=" gap-6 sm:gap-8 lg:gap-10">
    <section >
      <Scoreboard :teamId="favTeamId"/>
    </section>

    <section class="mt-6">
      <TenDayStretch />
    </section>

    <section class="mt-6">
      <div class="">
        <DivisionStanding :team-id="favTeamId" class="" />
        <TeamMVPs class="mt-6" />
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

const favTeamId = favorite.value?.id ?? 143;




</script>

<style scoped>

</style>
