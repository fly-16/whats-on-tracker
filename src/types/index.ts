export type Sport = 'soccer' | 'tennis';

export type GameStatus = 'upcoming' | 'live' | 'finished';

export interface Team {
  id: number;
  name: string;
  logo: string;
}

export interface League {
  id: number;
  name: string;
  logo: string;
  country?: string;
}

export interface Game {
  id: string;
  sport: Sport;
  league: League;
  startTime: string; // ISO string
  status: GameStatus;
  statusLabel: string; // e.g. "73'", "Q2 4:22", "Set 2", "HT", "FT"
  // Soccer
  homeTeam?: Team;
  awayTeam?: Team;
  homeScore?: number;
  awayScore?: number;
  // Tennis
  player1?: { id: number; name: string; photo: string; country: string; flag: string };
  player2?: { id: number; name: string; photo: string; country: string; flag: string };
  score?: string; // e.g. "6-4, 3-6, *4-3"
  serving?: 1 | 2;
  round?: string;
  stage?: string;
  tour?: string; // 'ATP' | 'WTA' for tennis
}
