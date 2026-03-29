import { NextRequest, NextResponse } from 'next/server';
import { fetchEspnSoccerFixtures } from '@/lib/espn-soccer';
import { fetchEspnTennisGames } from '@/lib/espn-tennis';
import { Game } from '@/types';

// Simple in-memory cache: key = "sport:date", value = { data, fetchedAt }
const cache = new Map<string, { data: Game[]; fetchedAt: number }>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const date = searchParams.get('date'); // YYYY-MM-DD
  const sport = searchParams.get('sport'); // 'soccer' | 'tennis' | 'all'
  const force = searchParams.get('force') === '1';

  if (!date) {
    return NextResponse.json({ error: 'Missing date param' }, { status: 400 });
  }

  const sports = sport === 'tennis' ? ['tennis'] : sport === 'soccer' ? ['soccer'] : ['soccer', 'tennis'];
  const now = Date.now();
  const results: Game[] = [];

  for (const s of sports) {
    const key = `${s}:${date}`;
    const cached = cache.get(key);
    if (!force && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      results.push(...cached.data);
      continue;
    }

    try {
      const games = s === 'soccer'
        ? await fetchEspnSoccerFixtures(date)
        : await fetchEspnTennisGames(date);
      cache.set(key, { data: games, fetchedAt: now });
      results.push(...games);
    } catch (err) {
      console.error(`Failed to fetch ${s} for ${date}:`, err);
      // Return empty array for this sport rather than failing the whole request
    }
  }

  // Sort by start time
  results.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return NextResponse.json({ games: results, fetchedAt: now });
}
