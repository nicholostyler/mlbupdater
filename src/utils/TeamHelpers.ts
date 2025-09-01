
export class TeamHelpers {
  /** Map of full team name → common 3-letter abbreviation */
  static readonly teamAbbreviations: Readonly<Record<string, string>> = Object.freeze({
    'Arizona Diamondbacks': 'ARI',
    'Atlanta Braves': 'ATL',
    'Baltimore Orioles': 'BAL',
    'Boston Red Sox': 'BOS',
    'Chicago White Sox': 'CWS',
    'Chicago Cubs': 'CHC',
    'Cincinnati Reds': 'CIN',
    'Cleveland Guardians': 'CLE',
    'Colorado Rockies': 'COL',
    'Detroit Tigers': 'DET',
    'Houston Astros': 'HOU',
    'Kansas City Royals': 'KC',
    'Los Angeles Angels': 'LAA',
    'Los Angeles Dodgers': 'LAD',
    'Miami Marlins': 'MIA',
    'Milwaukee Brewers': 'MIL',
    'Minnesota Twins': 'MIN',
    'New York Mets': 'NYM',
    'New York Yankees': 'NYY',
    'Oakland Athletics': 'OAK',
    'Philadelphia Phillies': 'PHI',
    'Pittsburgh Pirates': 'PIT',
    'San Diego Padres': 'SD',
    'San Francisco Giants': 'SF',
    'Seattle Mariners': 'SEA',
    'St. Louis Cardinals': 'STL',
    'Tampa Bay Rays': 'TB',
    'Texas Rangers': 'TEX',
    'Toronto Blue Jays': 'TOR',
    'Washington Nationals': 'WSH'
  });

  /** Returns the 3-letter code or the original name if not found. */
  static abbreviateTeamName(teamName: string): string {
    return TeamHelpers.teamAbbreviations[teamName] ?? teamName;
  }

  /**
   * Formats a short matchup like "PHI vs BOS" (if your team is home) or "BOS @ PHI".
   */
  static abbreviateMatchup(homeTeam: string, awayTeam: string, yourTeam: string): string {
    const home = TeamHelpers.abbreviateTeamName(homeTeam);
    const away = TeamHelpers.abbreviateTeamName(awayTeam);
    return homeTeam === yourTeam ? `${home} vs ${away}` : `${away} @ ${home}`;
  }

  static divisionFromId = (divisionId: number) =>
    Object.values(DIVISIONS).find(d => d.id === divisionId);

  static divisionKeyFromId = (divisionId: number) =>
    (Object.entries(DIVISIONS).find(([, d]) => d.id === divisionId)?.[0] as DivisionKey | undefined);

  static isNationalLeagueTeam = (id: number) => TEAM_BY_ID.get(id)?.isNL;

}

/**
 * nicholos.tyler.philliesupdater
 * Simple TS data + helpers mirroring the Kotlin logic.
 */

export type DivisionKey =
  | "AL_EAST"
  | "AL_CENTRAL"
  | "AL_WEST"
  | "NL_EAST"
  | "NL_CENTRAL"
  | "NL_WEST";

export const DIVISIONS: Record<DivisionKey, { id: number; name: string }> = {
  AL_EAST:   { id: 201, name: "American League East" },
  AL_CENTRAL:{ id: 202, name: "American League Central" },
  AL_WEST:   { id: 200, name: "American League West" },
  NL_EAST:   { id: 204, name: "National League East" },
  NL_CENTRAL:{ id: 205, name: "National League Central" },
  NL_WEST:   { id: 203, name: "National League West" },
} as const;

export interface Team {
  id: number;
  name: string;
  division: DivisionKey;
  isNL: boolean;
}

export const TEAMS: readonly Team[] = [
  // American League East
  { id: 110, name: "Baltimore Orioles",     division: "AL_EAST",    isNL: false },
  { id: 111, name: "Boston Red Sox",        division: "AL_EAST",    isNL: false },
  { id: 147, name: "New York Yankees",      division: "AL_EAST",    isNL: false },
  { id: 139, name: "Tampa Bay Rays",        division: "AL_EAST",    isNL: false },
  { id: 141, name: "Toronto Blue Jays",     division: "AL_EAST",    isNL: false },

  // American League Central
  { id: 145, name: "Chicago White Sox",     division: "AL_CENTRAL", isNL: false },
  { id: 114, name: "Cleveland Guardians",   division: "AL_CENTRAL", isNL: false },
  { id: 116, name: "Detroit Tigers",        division: "AL_CENTRAL", isNL: false },
  { id: 118, name: "Kansas City Royals",    division: "AL_CENTRAL", isNL: false },
  { id: 142, name: "Minnesota Twins",       division: "AL_CENTRAL", isNL: false },

  // American League West
  { id: 117, name: "Houston Astros",        division: "AL_WEST",    isNL: false },
  { id: 108, name: "Los Angeles Angels",    division: "AL_WEST",    isNL: false },
  { id: 133, name: "Oakland Athletics",     division: "AL_WEST",    isNL: false },
  { id: 136, name: "Seattle Mariners",      division: "AL_WEST",    isNL: false },
  { id: 140, name: "Texas Rangers",         division: "AL_WEST",    isNL: false },

  // National League East
  { id: 144, name: "Atlanta Braves",        division: "NL_EAST",    isNL: true },
  { id: 146, name: "Miami Marlins",         division: "NL_EAST",    isNL: true },
  { id: 121, name: "New York Mets",         division: "NL_EAST",    isNL: true },
  { id: 143, name: "Philadelphia Phillies", division: "NL_EAST",    isNL: true },
  { id: 120, name: "Washington Nationals",  division: "NL_EAST",    isNL: true },

  // National League Central
  { id: 112, name: "Chicago Cubs",          division: "NL_CENTRAL", isNL: true },
  { id: 113, name: "Cincinnati Reds",       division: "NL_CENTRAL", isNL: true },
  { id: 158, name: "Milwaukee Brewers",     division: "NL_CENTRAL", isNL: true },
  { id: 134, name: "Pittsburgh Pirates",    division: "NL_CENTRAL", isNL: true },
  { id: 138, name: "St. Louis Cardinals",   division: "NL_CENTRAL", isNL: true },

  // National League West
  { id: 109, name: "Arizona Diamondbacks",  division: "NL_WEST",    isNL: true },
  { id: 115, name: "Colorado Rockies",      division: "NL_WEST",    isNL: true },
  { id: 119, name: "Los Angeles Dodgers",   division: "NL_WEST",    isNL: true },
  { id: 135, name: "San Diego Padres",      division: "NL_WEST",    isNL: true },
  { id: 137, name: "San Francisco Giants",  division: "NL_WEST",    isNL: true },
] as const;


const TEAM_BY_ID = new Map(TEAMS.map(t => [t.id, t] as const));

export const teamFromId = (id: number) => TEAM_BY_ID.get(id);





export const TEAM_ABBREVIATIONS = TeamHelpers.teamAbbreviations;

export function abbreviateTeamName(teamName: string): string {
  return TeamHelpers.abbreviateTeamName(teamName);
}

export function abbreviateMatchup(homeTeam: string, awayTeam: string, yourTeam: string): string {
  return TeamHelpers.abbreviateMatchup(homeTeam, awayTeam, yourTeam);
}

export function winPctText(
  wins: number,
  totalGames: number,
  { style = 'ratio', decimals = 3 }: { style?: 'ratio' | 'percent'; decimals?: number } = {}
): string {
  const r = winPct(wins, totalGames, decimals);
  if (style === 'percent') return (r * 100).toFixed(Math.max(0, decimals - 1)) + '%';
  // Baseball-style: ".623" (drop leading 0)
  return r.toFixed(decimals).replace(/^0(?=\.)/, '');
}

export function winPct(wins: number, totalGames: number, decimals = 3): number {
  if (!Number.isFinite(wins) || !Number.isFinite(totalGames) || totalGames <= 0) return 0;
  const r = wins / totalGames;
  const m = Math.pow(10, decimals);
  return Math.round(r * m) / m;
}
