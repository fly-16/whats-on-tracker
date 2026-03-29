import { Game } from '@/types';
import { computeGameStatus, formatStatusLabel } from './game-status';

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/tennis';

const TOURS = [
  { slug: 'atp', label: 'ATP' },
  { slug: 'wta', label: 'WTA' },
];

interface EspnTennisCompetitor {
  id: string;
  order: number;
  winner?: boolean;
  linescores?: { value: number; winner?: boolean }[];
  athlete: {
    displayName: string;
    shortName: string;
    flag?: { href: string; alt: string };
    headshot?: { href: string };
  };
}

interface EspnTennisCompetition {
  id: string;
  date: string;
  startDate: string;
  timeValid: boolean;
  status: {
    period?: number;
    type: {
      state: string;
      completed: boolean;
      description: string;
      detail: string;
      shortDetail: string;
    };
  };
  notes?: { text: string; type: string }[];
  round?: { id: string; displayName: string };
  competitors: EspnTennisCompetitor[];
}

interface EspnTennisGrouping {
  grouping: { id: string; slug: string; displayName: string };
  competitions: EspnTennisCompetition[];
}

interface EspnTennisEvent {
  id: string;
  name: string;
  date: string;
  endDate: string;
  groupings: EspnTennisGrouping[];
}

function espnTennisStatusToShort(state: string, detail: string): string {
  if (state === 'post') return 'FINISHED';
  if (state === 'in') return 'LIVE';
  return 'NS';
}

function buildScore(c1: EspnTennisCompetitor, c2: EspnTennisCompetitor): string | undefined {
  const s1 = c1.linescores ?? [];
  const s2 = c2.linescores ?? [];
  if (!s1.length) return undefined;
  return s1.map((v, i) => `${v.value}-${s2[i]?.value ?? 0}`).join(', ');
}

// Prestigious tournaments: Grand Slams + ATP Masters 1000 + WTA 1000
const PRESTIGE_KEYWORDS = [
  // Grand Slams
  'australian open', 'french open', 'roland garros', 'wimbledon', 'us open',
  // Masters 1000 / WTA 1000
  'indian wells', 'bnp paribas open',
  'miami open',
  'monte-carlo', 'monte carlo',
  'madrid open', 'mutua madrid',
  'italian open', 'internazionali', 'foro italico',
  'canadian open', 'national bank open', 'rogers cup',
  'cincinnati', 'western & southern',
  'shanghai',
  'paris masters', 'rolex paris',
  // WTA 1000 additions
  'dubai', 'doha', 'qatar', 'china open', 'wuhan open',
  // Year-end finals
  'atp finals', 'wta finals', 'nitto atp',
];

function isPrestigious(eventName: string): boolean {
  const lower = eventName.toLowerCase();
  return PRESTIGE_KEYWORDS.some(kw => lower.includes(kw));
}

export async function fetchEspnTennisGames(date: string): Promise<Game[]> {
  const espnDate = date.replace(/-/g, '');

  const results = await Promise.allSettled(
    TOURS.map(tour =>
      fetch(`${BASE}/${tour.slug}/scoreboard?dates=${espnDate}`, { next: { revalidate: 0 } })
        .then(r => r.ok ? r.json() : { events: [] })
        .then(data => ({ tour, events: (data.events ?? []) as EspnTennisEvent[] }))
    )
  );

  const games: Game[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const { tour, events } = result.value;

    for (const event of events) {
      if (!isPrestigious(event.name)) continue;
      for (const grouping of event.groupings ?? []) {
        for (const comp of grouping.competitions ?? []) {
          // Filter to matches on the requested date
          const matchDate = new Date(comp.startDate || comp.date)
            .toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone, not UTC
          if (matchDate !== date) continue;

          if (seen.has(comp.id)) continue;
          seen.add(comp.id);

          const [c1, c2] = comp.competitors.sort((a, b) => a.order - b.order);
          if (!c1?.athlete || !c2?.athlete) continue;

          const statusShort = espnTennisStatusToShort(
            comp.status.type.state,
            comp.status.type.detail
          );
          const status = computeGameStatus('tennis', comp.startDate || comp.date, statusShort);

          // Derive tour from draw name — more reliable than the fetch endpoint
          const drawName = grouping.grouping.displayName.toLowerCase();
          const derivedTour = drawName.includes("women") ? 'WTA' : 'ATP';

          games.push({
            id: `tennis-${comp.id}`,
            sport: 'tennis',
            league: {
              id: parseInt(event.id),
              name: event.name,
              logo: '',
            },
            startTime: comp.startDate || comp.date,
            status,
            statusLabel: formatStatusLabel('tennis', statusShort),
            player1: {
              id: parseInt(c1.id),
              name: c1.athlete.displayName,
              photo: c1.athlete.headshot?.href ?? '',
              country: c1.athlete.flag?.alt ?? '',
              flag: c1.athlete.flag?.href ?? '',
            },
            player2: {
              id: parseInt(c2.id),
              name: c2.athlete.displayName,
              photo: c2.athlete.headshot?.href ?? '',
              country: c2.athlete.flag?.alt ?? '',
              flag: c2.athlete.flag?.href ?? '',
            },
            score: buildScore(c1, c2),
            tour: derivedTour,
            round: grouping.grouping.displayName,
            stage: comp.round?.displayName,
          });
        }
      }
    }
  }

  return games;
}
