<script setup lang="ts">
import Card from 'primevue/card'
import { type ScheduleGame, type TableModel, toTableVM } from '@/data/models/ScheduleGame.ts'
import { useRouter } from 'vue-router';
import { computed } from 'vue'

interface ScheduleCardProps {
  game?: ScheduleGame;
  teamId?: number;
}

const props = defineProps<ScheduleCardProps>()
const router = useRouter();

function resolveGame(): ScheduleGame | undefined {
  return props.game ?? undefined
}

function resolveTeam(): number | undefined {
  return props.teamId ?? undefined
}

function open(gamePk: number) {
  if (gamePk) router.push({ name: 'game-detail', params: { gamePk } });
}

function load() {
  const game = resolveGame();
  const teamId = resolveTeam();

  return computed<TableModel | null>(() => {
    if (!props.game) return null
    if (teamId) {
      return toTableVM(props.game, teamId)
    }
    return toTableVM(props.game, undefined)
  })
}

const cardGame = load();

</script>

<template>
  <Card
    class="gcard"
    @click="cardGame?.gamePk && open(cardGame.gamePk)"
  >
    <template #content>
      <div class="ggrid" v-if="cardGame">
        <!-- Left column: date -->
        <div class="gcol gcol-left">
          <div class="date">{{ cardGame.gameDateLabel }}</div>
        </div>

        <!-- Middle: matchup + venue -->
        <div class="gcol gcol-mid">
          <div class="matchup">{{ cardGame.matchup }}</div>
          <div class="venue">{{ cardGame.venue }}</div>
        </div>

        <!-- Right: score + result -->
        <div class="gcol gcol-right">
          <div class="score" v-if="cardGame.scoreText">{{ cardGame.scoreText }}</div>
          <div class="score" v-else>—</div>
          <div
            class="result"
            v-if="cardGame.result != 'null'"
            :class="{
                    win: cardGame.result === 'Win',
                    loss: cardGame.result === 'Loss',
                    tie: cardGame.result === 'Tie',
                    muted: !cardGame.result
                  }"
          >
            {{ cardGame.result || cardGame.state }}
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.gcard {
  min-width: 380px;
  scroll-snap-align: start;
  border-radius: 16px;
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
