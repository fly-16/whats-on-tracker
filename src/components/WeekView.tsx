'use client';

import { format, addDays, isToday } from 'date-fns';
import { Game } from '@/types';
import { isTbd } from '@/lib/game-filters';

type WeekSport = 'all' | 'football' | 'tennis';

interface Props {
  weekStart: Date;                       // Monday
  data: Record<string, Game[]>;          // keyed by yyyy-MM-dd
  sport: WeekSport;
}

// Short-name helpers — football keeps the club name (ellipsised), tennis shows surname.
function surname(name?: string) {
  return name?.split(' ').pop() ?? 'TBD';
}

export default function WeekView({ weekStart, data, sport }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="week-view">
      <div className="week-grid">
        {days.map(d => {
          const ds = format(d, 'yyyy-MM-dd');
          let games = (data[ds] ?? []).filter(g => !isTbd(g));
          if (sport === 'football') games = games.filter(g => g.sport === 'soccer');
          else if (sport === 'tennis') games = games.filter(g => g.sport === 'tennis');
          games = [...games].sort(
            (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
          );

          const today = isToday(d);
          return (
            <div
              key={ds}
              className={[
                'week-col',
                today ? 'is-today' : '',
                games.length === 0 ? 'is-empty' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="week-col-head">
                <span className="week-dow">{format(d, 'EEE')}</span>
                <span className="week-dom">{format(d, 'd')}</span>
              </div>

              <div className="week-col-body">
                {games.length === 0 ? (
                  <span className="week-none">—</span>
                ) : (
                  games.map(g => <WeekChip key={g.id} game={g} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekChip({ game }: { game: Game }) {
  const time = format(new Date(game.startTime), 'HH:mm');
  const live = game.status === 'live';
  const isSoccer = game.sport === 'soccer';

  const top = isSoccer ? game.homeTeam?.name : surname(game.player1?.name);
  const bottom = isSoccer ? game.awayTeam?.name : surname(game.player2?.name);

  return (
    <div className={`week-chip ${isSoccer ? 'football' : 'tennis'}`}>
      <div className="week-chip-top">
        <span className="week-chip-time">{time}</span>
        {live && <span className="week-live-dot" />}
      </div>
      <div className="week-chip-names">
        <span className="week-chip-name">{top ?? 'TBD'}</span>
        <span className="week-chip-name">{bottom ?? 'TBD'}</span>
      </div>
    </div>
  );
}
