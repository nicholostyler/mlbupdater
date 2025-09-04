import type { StatsApiTeam } from '@/services/mlb.ts'
import { abbreviateTeamName, abbreviateMatchup, TeamHelpers } from '@/utils/TeamHelpers.ts'

export interface ScheduleGame {
  gamePk: number;
  gameDate: string; // ISO
  status: { abstractGameState: string; detailedState: string };
  teams: {
    away: { team: StatsApiTeam; score?: number };
    home: { team: StatsApiTeam; score?: number };
  };
  venue?: { name: string };
}

export type TableModel = {
  gamePk: number
  gameDateLabel: string
  awayTeamLabel: string
  homeTeamLabel: string
  matchup: string
  venue: string
  scoreText: string | null
  result: 'Win' | 'Loss' | 'Tie' | 'null' | ''
  state: string
}

export function localStartTime(iso: string, tz = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Bad ISO date: ${iso}`);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz, // ensures viewer-local or a specific zone you pass in
  }).format(d);
}

function fmtDateLong(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function toTableVM(game: ScheduleGame, favoriteTeamId: number | undefined): TableModel {
  const home = game.teams.home.team
  const away = game.teams.away.team
  const homeAbbr = abbreviateTeamName(home.name)
  const awayAbbr = abbreviateTeamName(away.name)
  const isFinal = game.status.detailedState?.startsWith('Final') ?? false
  const isLive = game.status.abstractGameState === 'Live'
  const state = (isFinal && 'Final') || (isLive && 'In Progress') || game.status.detailedState || '—'

  const homeScore = game.teams.home.score ?? null
  const awayScore = game.teams.away.score ?? null

  if (favoriteTeamId != null) {
    const yourHome = home.id === favoriteTeamId
    const yourName = yourHome ? home.name : away.name

    const matchup = TeamHelpers
      .abbreviateMatchup(home.name, away.name, yourName)
      .replace(home.name, homeAbbr)
      .replace(away.name, awayAbbr)

    let yourScore: number | null = null
    let oppScore: number | null = null
    if (homeScore != null && awayScore != null) {
      yourScore = yourHome ? homeScore : awayScore
      oppScore = yourHome ? awayScore : homeScore

    }

    let result: TableModel['result'] = ''
    if (yourScore != null && oppScore != null) {
      result = yourScore > oppScore ? 'Win' : yourScore < oppScore ? 'Loss' : 'Tie'
    }

    const scoreText = yourScore != null && oppScore != null ? `${yourScore} - ${oppScore}` : null
    return {
      gamePk: game.gamePk,
      gameDateLabel: fmtDateLong(game.gameDate),
      awayTeamLabel: away.name,
      homeTeamLabel: home.name,
      matchup,
      venue: game.venue?.name ?? '',
      scoreText,
      result,
      state,
    }


  } else {

    const scoreText = homeScore != null && awayScore != null ? `${homeScore} - ${awayScore}` : null

    return {
      gamePk: game.gamePk,
      gameDateLabel: fmtDateLong(game.gameDate),
      awayTeamLabel: away.name,
      homeTeamLabel: home.name,
      matchup: `${homeAbbr} @ ${awayAbbr}`,
      venue: game.venue?.name ?? '',
      scoreText,
      result: 'null',
      state,
    }
  }
}
