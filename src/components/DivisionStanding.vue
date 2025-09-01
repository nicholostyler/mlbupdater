<template>
  <section class="w-full">
    <header class="mb-2 flex items-center justify-between">
      <h2 class="text-lg font-semibold tracking-tight">
        {{ heading }}
      </h2>
      <div class="text-sm text-gray-500">
        Season {{ season }}
      </div>
    </header>

    <DataTable
      :value="tableRows"
      dataKey="team.id"
      :loading="loading"
      responsiveLayout="scroll"
      :sortField="'pctNumeric'"
      :sortOrder="-1"
      size="small"
      class="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm"
      :pt="{ table: { class: 'min-w-full' } }"
      :scrollable="false"
      :showGridlines="false"
      :stripedRows="false"
      :rowHover="true"
      :emptyMessage="'No standings available.'"
    >
      <!-- Team -->
      <Column header="Team" sortable sortField="team.name">
        <template #body="{ data }">
          <div class="flex items-center gap-3">
            <span class="font-medium">
              {{ data.team.abbreviation || abbr(data.team.name) }}
            </span>
            <span class="text-gray-500 hidden sm:inline">{{ data.team.name }}</span>
          </div>
        </template>
      </Column>

      <!-- Wins -->
      <Column field="wins" header="W" sortable headerClass="!text-right" bodyClass="!text-right tabular-nums" />

      <!-- Losses -->
      <Column field="losses" header="L" sortable headerClass="!text-right" bodyClass="!text-right tabular-nums" />

      <!-- Win % -->
      <Column header="Pct" sortable sortField="pctNumeric" headerClass="!text-right" bodyClass="!text-right tabular-nums">
        <template #body="{ data }">
          {{ pctText(data.wins, data.wins + data.losses) }}
        </template>
      </Column>
    </DataTable>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { abbreviateTeamName as abbr, winPctText as pctText } from '../utils/TeamHelpers.ts'
import { fetchDivisionStandingsForTeam, type StandingRecord } from '../services/mlb.ts'

type Props = {
  /** Either pass teamId (we infer division from the team) */
  teamId?: number
  /** Or pass divisionId directly (e.g., 201 AL East, 204 NL East, etc.) */
  divisionId?: number
  /** Optional leagueId (103 = AL, 104 = NL). Used only when divisionId is provided. */
  leagueId?: number
  /** Override the title text */
  title?: string
  /** MLB season as a four-digit string; defaults to current year */
  season?: string
}

const props = withDefaults(defineProps<Props>(), {
  season: new Date().getFullYear().toString()
})

const loading = ref(false)
const rows = ref<StandingRecord[]>([])

const season = computed(() => props.season)
const heading = computed(() => props.title || 'Division Standings')

/**
 * Fetch standings by StatsAPI for a specific division.
 * We keep this local to avoid coupling callers to a team when they already know the division.
 */
async function fetchByDivision(leagueId: number, divisionId: number, season: string) {
  const url = `https://statsapi.mlb.com/api/v1/standings?leagueId=${leagueId}&season=${season}&standingsTypes=regularSeason`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const json = await res.json()
  const block = (json?.records ?? []).find((r: any) => r?.division?.id === divisionId)
  rows.value = (block?.teamRecords ?? []).map((tr: any) => ({
    team: tr.team,
    wins: tr.wins,
    losses: tr.losses,
    pct: tr.pct
  }))
}

/** Minimal league inference if caller only provides a division id */
function inferLeagueId(divisionId?: number): number {
  if (!divisionId) return 103 // fallback AL
  // NL divisions in StatsAPI ids
  const NL = new Set([204, 205, 203])
  return NL.has(divisionId) ? 104 : 103
}

async function load() {
  loading.value = true
  try {
    if (props.teamId) {
      // Reuse your existing helper that returns the team's division standings
      rows.value = await fetchDivisionStandingsForTeam(props.teamId, season.value)
    } else if (props.divisionId) {
      const leagueId = props.leagueId ?? inferLeagueId(props.divisionId)
      await fetchByDivision(leagueId, props.divisionId, season.value)
    } else {
      rows.value = []
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
// Re-run when inputs change
watch(() => [props.teamId, props.divisionId, props.leagueId, props.season], load)

/** Table rows with numeric pct for sorting */
const tableRows = computed(() =>
  rows.value.map((r) => ({
    ...r,
    pctNumeric:
      typeof r.pct === 'number'
        ? r.pct
        : typeof r.pct === 'string'
          ? parseFloat(r.pct)
          : (r.wins || 0) / Math.max(1, (r.wins || 0) + (r.losses || 0))
  }))
)
</script>

<style scoped>
.tabular-nums { font-variant-numeric: tabular-nums; }
</style>
