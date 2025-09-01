export interface MlbTeamLeadersResponse {
  copyright: string;
  teamLeaders: TeamLeader[];
}

export type LeaderCategory =
  | 'homeRuns'
  | 'runsBattedIn'
  | 'battingAverage'
  | 'strikeouts'
  | 'earnedRunAverage'
  | string;

export type StatGroup = 'hitting' | 'pitching' | 'catching' | string;

/** Game type in MLB API (e.g., Regular Season "R"). */
export interface GameType {
  id: string; // e.g., "R"
  description: string; // e.g., "Regular Season"
}

/** Common references used across items. */
export interface TeamRef {
  id: number;
  name: string;
  link: string; // e.g., "/api/v1/teams/143"
}

export interface LeagueRef {
  id: number;
  name: string; // e.g., "NL"
  link: string; // e.g., "/api/v1/league/104"
}

export interface PersonRef {
  id: number;
  fullName: string;
  link: string; // e.g., "/api/v1/people/656941"
  firstName?: string;
  lastName?: string;
}

export interface SportRef {
  id: number; // e.g., 1
  link: string; // e.g., "/api/v1/sports/1"
  abbreviation: string; // e.g., "MLB"
}

/** A single leaderboard entry for a player. */
export interface LeaderEntry {
  rank: number;          // 1, 2, ...
  value: string;         // NOTE: numbers come as strings in the feed (e.g., "45", ".298")
  team: TeamRef;
  league: LeagueRef;
  person: PersonRef;
  sport: SportRef;
  season: string;        // e.g., "2025"
}


export interface TeamLeader {
  leaderCategory: LeaderCategory;   // e.g., "homeRuns", "strikeouts", ...
  season: string;                   // e.g., "2025"
  gameType: GameType;               // e.g., { id: "R", description: "Regular Season" }
  leaders: LeaderEntry[];           // top result(s) for the category
  statGroup: StatGroup;             // "hitting" | "pitching" | "catching"
  team: TeamRef;                    // the team the leaders belong to
  totalSplits: number;              // sample shows integers like 15, 21, ...
}
