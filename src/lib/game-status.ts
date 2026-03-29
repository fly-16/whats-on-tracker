import { GameStatus } from '@/types';

export function computeGameStatus(
  sport: string,
  startTimeIso: string,
  apiStatusShort: string
): GameStatus {
  if (LIVE_STATUS_SHORTS.has(apiStatusShort)) return 'live';
  if (FINISHED_STATUS_SHORTS.has(apiStatusShort)) return 'finished';
  return 'upcoming';
}

// API-Sports soccer status short codes
const LIVE_STATUS_SHORTS = new Set([
  '1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE',
  // Tennis
  'IN_PLAY', 'STARTED', '1S', '2S', '3S', '4S', '5S',
]);

const FINISHED_STATUS_SHORTS = new Set([
  'FT', 'AET', 'PEN', 'AWD', 'WO',
  // Tennis
  'FINISHED', 'FIN', 'RETIRED',
]);

export function formatStatusLabel(sport: string, apiStatusShort: string, elapsed?: number | null): string {
  if (sport === 'soccer') {
    if (apiStatusShort === 'HT') return 'HT';
    if (apiStatusShort === 'FT') return 'FT';
    if (apiStatusShort === 'AET') return 'AET';
    if (apiStatusShort === 'PEN') return 'Pens';
    if (apiStatusShort === 'ET') return elapsed ? `${elapsed}'` : 'ET';
    if (['1H', '2H'].includes(apiStatusShort) && elapsed) return `${elapsed}'`;
    if (apiStatusShort === 'NS') return 'Upcoming';
    if (apiStatusShort === 'PST') return 'Postponed';
    if (apiStatusShort === 'CANC') return 'Cancelled';
    return apiStatusShort;
  }

  if (sport === 'tennis') {
    if (['FINISHED', 'FIN'].includes(apiStatusShort)) return 'Finished';
    if (apiStatusShort === 'RETIRED') return 'Retired';
    if (apiStatusShort === 'NOT_STARTED' || apiStatusShort === 'NS') return 'Upcoming';
    const setMap: Record<string, string> = { '1S': 'Set 1', '2S': 'Set 2', '3S': 'Set 3', '4S': 'Set 4', '5S': 'Set 5' };
    if (setMap[apiStatusShort]) return setMap[apiStatusShort];
    return apiStatusShort;
  }

  return apiStatusShort;
}
