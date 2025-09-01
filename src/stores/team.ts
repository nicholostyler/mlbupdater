
export interface FavoriteTeam {
  id: number;        // MLB StatsAPI teamId
  name: string;
  abbreviation: string;
  divisionId?: number;
  leagueId?: number;
}

const STORAGE_KEY = 'mlb.favoriteTeam.v1';

export const useTeamStore = defineStore('team', {
  state: () => ({
    favorite: (null as FavoriteTeam | null)
  }),
  actions: {
    setFavorite(team: FavoriteTeam) {
      this.favorite = team;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
    },
    load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try { this.favorite = JSON.parse(raw); } catch {}
      }
      // sane default if nothing set: NYY
      if (!this.favorite) {
        this.favorite = { id: 147, name: 'New York Yankees', abbreviation: 'NYY', leagueId: 103 };
      }
    }
  }
});
