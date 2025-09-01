import { ref, readonly} from 'vue';

export interface FavoriteTeam {
  id: number;
  name: string;
  abbreviation: string;
  divisionId?: number;
  leagueId: number;
}

const STORAGE_KEY = "mlbupdater.favoriteTeam"
const favorite = ref<FavoriteTeam | null>(null);
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      favorite.value = JSON.parse(raw);
    }

  } catch {
    console.log("Error collecting favorite team")
  }

  if (!favorite.value) {
    favorite.value = {
      id: 143,
      name: "Philadelphia Phillies",
      abbreviation: "PHI",
      leagueId: 1
    }
  }
}

  function setFavorite(team: FavoriteTeam) {
    favorite.value = team;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
  }

  export function useTeam() {
    init();
    return {
      favorite: readonly(favorite),
      setFavorite
    };
  }
