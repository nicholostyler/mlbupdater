// Minimal MLB Stats API client (free, no key)
import type { PlayerInfo, PlayerSeasonStats } from '@/data/models/Player.ts'
import { DIVISIONS, teamFromId, type DivisionKey} from '@/utils/TeamHelpers.ts'

const BASE = 'https://statsapi.mlb.com';

export type StatsApiTeam = {
  id: number;
  name: string;
  abbreviation: string;
  teamName: string;
  league?: { id: number; name: string };
  division?: { id: number; name: string };
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json() as T;
}

export function todayYYYYMMDD(): string {
  // Use local date (user-local). If you want ET explicitly, adjust via Intl/TimeZone.
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// --- Teams

export async function fetchActiveTeams(): Promise<StatsApiTeam[]> {
  const data = await get<{ teams: StatsApiTeam[] }>(`/api/v1/teams?sportId=1&activeStatus=Yes`);
  return data.teams;
}

export async function fetchTeam(teamId: number): Promise<StatsApiTeam | null> {
  const data = await get<{ teams: StatsApiTeam[] }>(`/api/v1/teams?teamId=${teamId}`);
  return data.teams?.[0] ?? null;
}

// --- Schedule

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

export async function fetchTeamSchedule(teamId: number, startDate: string, endDate: string) {
  const data = await get<{ dates: { date: string; games: ScheduleGame[] }[] }>(
    `/api/v1/schedule?sportId=1&teamId=${teamId}&startDate=${startDate}&endDate=${endDate}`
  );
  const games: ScheduleGame[] = [];
  for (const d of data.dates) games.push(...d.games);
  return games.sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime());
}

export async function fetchTodaysTeamGame(teamId: number, date: string) {
  const games = await fetchTeamSchedule(teamId, date, date);
  return games[0] ?? null;
}

export async function fetchLiveGame(gamePk: number) {
  // live feed includes linescore, plays, etc.
  return await get<any>(`/api/v1.1/game/${gamePk}/feed/live`);
}

// --- Standings (division-filtered)

export interface StandingRecord {
  team: StatsApiTeam;
  wins: number;
  losses: number;
  pct: string;
}

export type DivisionStandingOptions = {
  season: string;
  teamId?: number;     // resolve division/league from helper
  divisionId?: number; // pass division directly (e.g., 204 = NL East)
  leagueId?: number;   // optional; inferred if omitted
};

/**
 * Fetch division standings using either a teamId or a divisionId.
 * - If teamId is provided, we resolve divisionId + leagueId via the helper.
 * - If only divisionId is provided, leagueId is inferred from division.
 */
export async function fetchDivisionStandings(
  opts: DivisionStandingOptions
): Promise<StandingRecord[]> {
  const { season } = opts;
  let leagueId = opts.leagueId;
  let divisionId = opts.divisionId;

  // Resolve from team via helper (no network hit)
  if (opts.teamId && (!divisionId || !leagueId)) {
    const t = teamFromId(opts.teamId);
    if (!t) throw new Error(`Unknown team id: ${opts.teamId}`);

    // In the helper: t.division is a DivisionKey; DIVISIONS[key].id is the StatsAPI division id
    divisionId = divisionId ?? DIVISIONS[t.division as DivisionKey].id;
    leagueId = leagueId ?? (t.isNL ? 104 : 103); // 104 = NL, 103 = AL
  }

  if (!divisionId) {
    throw new Error('divisionId is required (provide divisionId or teamId).');
  }

  // Infer league from division if still missing
  if (!leagueId) {
    const NL = new Set([
      DIVISIONS.NL_EAST.id,
      DIVISIONS.NL_CENTRAL.id,
      DIVISIONS.NL_WEST.id,
    ]);
    leagueId = NL.has(divisionId) ? 104 : 103;
  }

  // Single league call, then pick the division block we care about
  // API shape: { records: [{ division: { id }, teamRecords: [...] }, ...] }
  const data = await get<any>(
    `/api/v1/standings?leagueId=${leagueId}&season=${season}&standingsTypes=regularSeason`
  ); // :contentReference[oaicite:1]{index=1}

  const block = (data?.records ?? []).find((r: any) => r?.division?.id === divisionId);
  const rows: StandingRecord[] = (block?.teamRecords ?? []).map((tr: any) => ({
    team: tr.team,
    wins: tr.wins,
    losses: tr.losses,
    pct: tr.pct,
  }));
  return rows;
}

// Delete soon only here for backward compatibility
export async function fetchDivisionStandingsForTeam(
  teamId: number,
  season: string
): Promise<StandingRecord[]> {
  return fetchDivisionStandings({ teamId, season });
}
// --- Team leaders (very simple "MVPs")

export interface TeamLeader {
  player: { id: number; fullName: string };
  value: string;
  stat: string;
}

export async function fetchTeamLeaders(teamId: number, season: string) {
  const categories = ['homeRuns','runsBattedIn','battingAverage','strikeouts','earnedRunAverage'];
  const q = `/api/v1/teams/${teamId}/leaders?season=${season}&leaderGameTypes=R&limit=1&leaderCategories=${categories.join(',')}`;
  const data = await get<any>(q);

  const wanted: Record<string,'hitting'|'pitching'> = {
    homeRuns: 'hitting',
    runsBattedIn: 'hitting',
    battingAverage: 'hitting',
    strikeouts: 'pitching',
    earnedRunAverage: 'pitching'
  };

  const map: Record<string, TeamLeader | null> = {};
  for (const block of data.teamLeaders ?? []) {
    const need = wanted[block.leaderCategory];
    if (need && block.statGroup !== need) continue;    // <- key filter
    const top = block.leaders?.[0];
    if (top?.person) {
      map[block.leaderCategory] = {
        player: { id: top.person.id, fullName: top.person.fullName },
        value: String(top.value),
        stat: block.leaderCategory
      };
    }
  }
  return map;
}



// --- Player season stats (combined groups) ---
export async function fetchPlayerSeasonStatsCombined(playerId: number, season: string): Promise<PlayerSeasonStats> {
  const q = `/api/v1/people/${playerId}/stats?stats=season&group=hitting,pitching&season=${season}`;
  const resp = await get<any>(q);
  const blocks = resp?.stats ?? [];

  const out: PlayerSeasonStats = {};
  for (const b of blocks) {
    const group = (b?.group?.displayName ?? '').toLowerCase();
    const splits = (b?.splits ?? []).map((s: any) => ({
      season: s.season,
      team: s.team ? { id: s.team.id, name: s.team.name } : undefined,
      stat: s.stat || {}
    }));
    if (group === 'hitting' && splits.length) out.hitting = { type: 'hitting', splits };
    if (group === 'pitching' && splits.length) out.pitching = { type: 'pitching', splits };
  }
  return out;
}

// --- Player info ---
export async function fetchPlayerInfo(playerId: number): Promise<PlayerInfo> {
  const data = await get<any>(`/api/v1/people/${playerId}?hydrate=team`);
  const p = data?.people?.[0];
  if (!p) throw new Error('Player not found');
  return {
    id: p.id,
    fullName: p.fullName,
    primaryNumber: p.primaryNumber,
    currentAge: p.currentAge,
    currentTeam: p.currentTeam
      ? { id: p.currentTeam.id, name: p.currentTeam.name, abbreviation: p.currentTeam.abbreviation }
      : undefined,
    primaryPosition: p.primaryPosition,
    batSide: p.batSide,
    pitchHand: p.pitchHand,
    height: p.height,
    weight: p.weight,
    birthDate: p.birthDate,
    mlbDebutDate: p.mlbDebutDate
  };
}

