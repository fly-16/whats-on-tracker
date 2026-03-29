import { Game } from '@/types';
import { computeGameStatus, formatStatusLabel } from './game-status';
import { format } from 'date-fns';

// ESPN league slugs → metadata
const LEAGUES: { slug: string; id: number; name: string; country?: string }[] = [
  { slug: 'eng.1',            id: 39,  name: 'Premier League',          country: 'England' },
  { slug: 'eng.w.1',          id: 754, name: "Women's Super League",     country: 'England' },
  { slug: 'uefa.champions',   id: 2,   name: 'Champions League' },
  { slug: 'uefa.europa',      id: 3,   name: 'Europa League' },
  { slug: 'uefa.wchampions',  id: 5,   name: "Women's Champions League" },
  { slug: 'fifa.world',       id: 1,   name: 'World Cup' },
  { slug: 'fifa.wwc',         id: 8,   name: "Women's World Cup" },
];

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';

interface EspnEvent {
  id: string;
  name: string;
  date: string;
  status: {
    type: {
      state: string;
      completed: boolean;
      shortDetail: string;
      detail: string;
    };
    displayClock?: string;
  };
  competitions: Array<{
    competitors: Array<{
      homeAway: 'home' | 'away';
      team: { displayName: string; logo?: string };
      score?: string;
    }>;
  }>;
}

function espnStateToStatusShort(state: string, detail: string): string {
  if (state === 'post') return 'FT';
  if (state === 'in') {
    if (detail === 'HT') return 'HT';
    return 'LIVE';
  }
  return 'NS';
}

async function fetchLeague(slug: string, dateStr: string): Promise<EspnEvent[]> {
  // ESPN dates param uses YYYYMMDD format
  const espnDate = dateStr.replace(/-/g, '');
  const res = await fetch(`${BASE}/${slug}/scoreboard?dates=${espnDate}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.events ?? [];
}

export async function fetchEspnSoccerFixtures(date: string): Promise<Game[]> {
  // Fetch all leagues in parallel
  const results = await Promise.allSettled(
    LEAGUES.map(league => fetchLeague(league.slug, date).then(events => ({ league, events })))
  );

  const games: Game[] = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const { league, events } = result.value;

    for (const event of events) {
      const comp = event.competitions?.[0];
      if (!comp) continue;

      const home = comp.competitors.find(c => c.homeAway === 'home');
      const away = comp.competitors.find(c => c.homeAway === 'away');
      if (!home || !away) continue;

      const statusShort = espnStateToStatusShort(
        event.status.type.state,
        event.status.type.shortDetail
      );

      // Extract elapsed from detail like "73'" or "HT"
      const elapsedMatch = event.status.type.detail?.match(/^(\d+)'/);
      const elapsed = elapsedMatch ? parseInt(elapsedMatch[1]) : null;

      const status = computeGameStatus('soccer', event.date, statusShort);

      games.push({
        id: `soccer-${event.id}`,
        sport: 'soccer',
        league: {
          id: league.id,
          name: league.name,
          logo: '',
          country: league.country,
        },
        startTime: event.date,
        status,
        statusLabel: formatStatusLabel('soccer', statusShort, elapsed),
        homeTeam: {
          id: 0,
          name: home.team.displayName,
          logo: home.team.logo ?? '',
        },
        awayTeam: {
          id: 0,
          name: away.team.displayName,
          logo: away.team.logo ?? '',
        },
        homeScore: home.score !== undefined ? parseInt(home.score) : undefined,
        awayScore: away.score !== undefined ? parseInt(away.score) : undefined,
      });
    }
  }

  return games;
}
