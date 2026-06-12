import { Game } from '@/types';

// A participant whose name is missing or the literal "TBD" placeholder the feed uses.
export function unknownName(name?: string): boolean {
  return !name || name.trim().toUpperCase() === 'TBD';
}

// A placeholder fixture with both participants unknown — hidden from the schedule.
export function isTbd(g: Game): boolean {
  return g.sport === 'soccer'
    ? unknownName(g.homeTeam?.name) && unknownName(g.awayTeam?.name)
    : unknownName(g.player1?.name) && unknownName(g.player2?.name);
}
