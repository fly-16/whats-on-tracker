'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { RefreshCw, Radio } from 'lucide-react';
import Image from 'next/image';

import { Game } from '@/types';
import DayPicker from '@/components/DayPicker';
import GameCard from '@/components/GameCard';

// EPL + WSL are pinned tabs — always shown in the football filter
const PINNED_FOOTBALL_IDS = new Set([39, 754]);


export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [liveOnly, setLiveOnly] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [selectedFootballLeague, setSelectedFootballLeague] = useState<number | null>(null);
  const [tzAbbr, setTzAbbr] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  const fetchSchedule = useCallback(async (date: Date, force = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await fetch(`/api/schedule?date=${dateStr}&sport=all${force ? '&force=1' : ''}`);
      if (!res.ok) throw new Error('Failed to load schedule');
      const data = await res.json();
      setGames(data.games);
      setLastFetched(new Date());
    } catch {
      setError('Could not load schedule.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { if (!selectedDate) setSelectedDate(new Date()); }, [selectedDate]);
  useEffect(() => {
    setTzAbbr(new Date().toLocaleTimeString('en', { timeZoneName: 'short' }).split(' ').pop() ?? '');
  }, []);
  useEffect(() => { if (selectedDate) fetchSchedule(selectedDate); }, [selectedDate, fetchSchedule]);

  const soccerGames = useMemo(() => games.filter(g => g.sport === 'soccer'), [games]);
  const tennisGames = useMemo(() => games.filter(g => g.sport === 'tennis'), [games]);

  const availableLeagues = useMemo(() => {
    const seen = new Map<number, { id: number; name: string; logo: string }>();
    for (const g of soccerGames) {
      if (!PINNED_FOOTBALL_IDS.has(g.league.id) && !seen.has(g.league.id))
        seen.set(g.league.id, { id: g.league.id, name: g.league.name, logo: g.league.logo });
    }
    return Array.from(seen.values());
  }, [soccerGames]);

  const visibleSoccer = useMemo(() => {
    let list = soccerGames;
    if (selectedFootballLeague !== null)
      list = list.filter(g => g.league.id === selectedFootballLeague);
    if (liveOnly) list = list.filter(g => g.status === 'live');
    return list;
  }, [soccerGames, selectedFootballLeague, liveOnly]);

  const visibleTennis = useMemo(() => {
    return liveOnly ? tennisGames.filter(g => g.status === 'live') : tennisGames;
  }, [tennisGames, liveOnly]);

  const handleDateChange = useCallback((date: Date) => setSelectedDate(date), []);

  const today = new Date();
  const isToday = selectedDate
    ? format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    : true;
  useEffect(() => {
    const update = () => setCurrentTime(format(new Date(), 'HH:mm'));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="app-shell">

      {/* ── Header ── */}
      <div className="app-header">
        <div className="header-top">
          <div className="app-title">
            what's <span>on</span>
          </div>

          <div className="header-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isToday && (
                <button
                  onClick={() => setLiveOnly(v => !v)}
                  className={`live-filter-pill${liveOnly ? ' active' : ''}`}
                >
                  <Radio size={9} />
                  Live
                </button>
              )}
              {lastFetched && !isLoading && (
                <span style={{ fontFamily: 'var(--font-fira), monospace', fontSize: 11, color: 'var(--text)' }}>
                  {format(lastFetched, 'HH:mm')}
                </span>
              )}
              {selectedDate && (
                <button
                  onClick={() => fetchSchedule(selectedDate, true)}
                  disabled={isLoading}
                  className="refresh-btn"
                >
                  <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="calendar-row">
          {selectedDate && <DayPicker date={selectedDate} onChange={handleDateChange} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {currentTime && (
              <span className="date-badge">{currentTime}</span>
            )}
            {tzAbbr && (
              <span className="date-badge">{tzAbbr}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      {isLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
          <div className="animate-spin" style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid var(--border2)', borderTopColor: 'var(--text2)' }} />
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Loading schedule…</span>
        </div>
      ) : error ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>{error}</p>
          <button
            onClick={() => selectedDate && fetchSchedule(selectedDate)}
            style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="panels">
          {/* ── Football panel ── */}
          <div className="sport-panel football-panel">
            <FootballPanel
              games={visibleSoccer}
              availableLeagues={availableLeagues}
              selectedLeague={selectedFootballLeague}
              onSelectLeague={setSelectedFootballLeague}
              liveOnly={liveOnly}
            />
          </div>

          {/* ── Tennis panel ── */}
          <div className="sport-panel">
            <TennisPanel
              games={visibleTennis}
              liveOnly={liveOnly}
            />
          </div>
        </div>
      )}

    </div>
  );
}

// ── Football Panel ─────────────────────────────────────────────────────────────

const LEAGUE_ABBR: Record<number, string> = {
  39: 'EPL', 754: 'WSL', 2: 'UCL', 3: 'UEL', 848: 'UECL',
  5: 'UWCL', 1: 'World Cup', 4: 'Euros', 9: 'Copa América',
};

function FootballPanel({
  games, availableLeagues, selectedLeague, onSelectLeague, liveOnly,
}: {
  games: Game[];
  availableLeagues: { id: number; name: string; logo: string }[];
  selectedLeague: number | null;
  onSelectLeague: (id: number | null) => void;
  liveOnly: boolean;
}) {
  return (
    <>
      <div className="panel-header">
        <div className="panel-title-row">
          <span className="sport-dot green" />
          <span className="panel-title green">Football</span>
          <span className="panel-count">{games.length}</span>
        </div>

        <div className="tabs-row">
          <button
            onClick={() => onSelectLeague(null)}
            className={`league-tab f-tab${selectedLeague === null ? ' active' : ''}`}
          >All</button>
          {([{ id: 39, abbr: 'EPL' }, { id: 754, abbr: 'WSL' }]).map(({ id, abbr }) => (
            <button
              key={id}
              onClick={() => onSelectLeague(selectedLeague === id ? null : id)}
              className={`league-tab f-tab${selectedLeague === id ? ' active' : ''}`}
            >{abbr}</button>
          ))}
          {availableLeagues.map(l => {
            const active = selectedLeague === l.id;
            return (
              <button
                key={l.id}
                onClick={() => onSelectLeague(active ? null : l.id)}
                className={`league-tab f-tab${active ? ' active' : ''}`}
              >
                {LEAGUE_ABBR[l.id] ?? l.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="match-list">
          {games.length === 0 ? (
            <PanelEmpty sport="soccer" liveOnly={liveOnly} />
          ) : (
            games.map(g => <GameCard key={g.id} game={g} />)
          )}
      </div>
    </>
  );
}

// ── Tennis Panel ───────────────────────────────────────────────────────────────

function TennisPanel({
  games, liveOnly,
}: {
  games: Game[];
  liveOnly: boolean;
}) {
  const [selectedTour, setSelectedTour] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

  const availableTours = useMemo(() => {
    const seen = new Set<string>();
    for (const g of games) if (g.tour) seen.add(g.tour);
    return Array.from(seen).sort();
  }, [games]);

  const tourFiltered = useMemo(() => {
    if (!selectedTour) return games;
    return games.filter(g => g.tour === selectedTour);
  }, [games, selectedTour]);

  const availableTournaments = useMemo(() => {
    const seen = new Map<string, { id: number; name: string }>();
    for (const g of tourFiltered) {
      const key = String(g.league.id);
      if (!seen.has(key)) seen.set(key, { id: g.league.id, name: g.league.name });
    }
    return Array.from(seen.values());
  }, [tourFiltered]);

  useEffect(() => { setSelectedTour(null); setSelectedTournament(null); }, [games]);
  useEffect(() => { setSelectedTournament(null); }, [selectedTour]);

  const visibleGames = useMemo(() => {
    if (!selectedTournament) return tourFiltered;
    return tourFiltered.filter(g => String(g.league.id) === selectedTournament);
  }, [tourFiltered, selectedTournament]);

  const isFiltered = selectedTournament !== null;

  return (
    <>
      <div className="panel-header">
        <div className="panel-title-row">
          <span className="sport-dot blue" />
          <span className="panel-title blue">Tennis</span>
          <span className="panel-count">{games.length}</span>
        </div>

        <div className="tabs-row">
            <button
              onClick={() => { setSelectedTour(null); setSelectedTournament(null); }}
              className={`league-tab t-tab${selectedTour === null ? ' active' : ''}`}
            >All</button>
            {(['ATP', 'WTA'] as const).map(tour => (
              <button
                key={tour}
                onClick={() => { setSelectedTour(tour); setSelectedTournament(null); }}
                className={`league-tab t-tab${selectedTour === tour ? ' active' : ''}`}
              >
                {tour}
              </button>
            ))}
            {availableTournaments.length > 1 && availableTournaments.map(t => {
              const active = selectedTournament === String(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTournament(active ? null : String(t.id))}
                  className={`league-tab t-tab${active ? ' active' : ''}`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
      </div>

      <div className="match-list">
          {visibleGames.length === 0 ? (
            <PanelEmpty sport="tennis" liveOnly={liveOnly} />
          ) : (
            visibleGames.map(g => (
              <GameCard key={g.id} game={g} hideLeague={isFiltered} />
            ))
          )}
      </div>
    </>
  );
}

// ── Panel empty state ──────────────────────────────────────────────────────────

function PanelEmpty({ sport, liveOnly }: { sport: 'soccer' | 'tennis'; liveOnly: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 16px', gap: 12 }}>
      <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {sport === 'soccer'
          ? <Image src="/sleepy_football.png" alt="No football today" width={180} height={180} unoptimized style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          : <Image src="/sleepy_tennis.png" alt="No tennis today" width={180} height={180} unoptimized style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        }
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: 'var(--text2)', fontWeight: 500 }}>
          {liveOnly ? 'No live matches' : 'Nothing scheduled'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
          {liveOnly ? 'Check back later' : 'Try a different date'}
        </p>
      </div>
    </div>
  );
}
