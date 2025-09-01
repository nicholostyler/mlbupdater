export type Handedness = 'R' | 'L' | 'S' | string;
export interface TeamMini { id: number; name: string; abbreviation?: string; }
export interface Position { code?: string; name?: string; type?: string; abbreviation?: string; }
export interface PlayerInfo {
  id: number; fullName: string; primaryNumber?: string; currentAge?: number;
  currentTeam?: TeamMini; primaryPosition?: Position;
  batSide?: { code?: Handedness; description?: string };
  pitchHand?: { code?: Handedness; description?: string };
  height?: string; weight?: number; birthDate?: string; mlbDebutDate?: string;
}
export interface StatSplit { season?: string; team?: TeamMini; stat: Record<string, string | number | null | undefined>; }
export interface PlayerHittingSeason { type: 'hitting'; splits: StatSplit[]; }
export interface PlayerPitchingSeason { type: 'pitching'; splits: StatSplit[]; }
export interface PlayerSeasonStats { hitting?: PlayerHittingSeason; pitching?: PlayerPitchingSeason; }


/** Raw combined-season response for group=hitting,pitching */
export interface StatsBlock {
  group?: { displayName?: 'hitting'|'pitching'|string };
  type?: { displayName?: string };
  splits?: StatSplit[];
}

export interface PlayerSeasonStatsResponse {
  stats?: StatsBlock[];
}
