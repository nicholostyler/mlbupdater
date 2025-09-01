export interface RunnerMovement {
  start?: '1B'|'2B'|'3B'|'home'|null;
  end?: '1B'|'2B'|'3B'|'home'|null;
  isOut?: boolean;
}

export interface Runner {
  movement?: RunnerMovement;
}

export interface PlayDetails {
  event?: string;
  description?: string;
  call?: { description?: string };
  type?: string;
}

export interface PlayCount {
  balls?: number;
  strikes?: number;
  outs?: number;
}

export interface BatterRef { id?: number }

export interface Play {
  playId?: string;
  endTime?: string;
  about?: { inning?: number; isTopInning?: boolean };
  result?: { description?: string };
  details?: PlayDetails;
  count?: PlayCount;
  matchup?: { batter?: BatterRef };
  runners?: Runner[];
}

export interface LiveGame {
  gameData?: {
    game?: {
      pk: number,
      type: "R" | string,
      doubleHeader: "N" | "Y",
      id: string,
      gamedayType: "P" | string,
      tiebreaker: "N" | "Y",
      gameNumber: 1 | number,
      calendarEventID: string,
      season: string,
      seasonDisplay: string
    }
    status?: {
      abstractGameState?: 'Live'|'Final'|'Preview'|string;
      detailedState?: string;
    };
    teams?: {
      away?: { name?: string; score?: number };
      home?: { name?: string; score?: number };
    };
    venue?: { name?: string };
    datetime?: { time?: string };
  };
  liveData?: {
    linescore?: {
      currentInning?: number;
      isTopInning?: boolean;
      teams?: {
        away?: { runs?: number };
        home?: { runs?: number };
      };
    };
    plays?: { allPlays?: Play[] };
  };
}
