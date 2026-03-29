'use client';

import { Game } from '@/types';
import LiveBadge from './LiveBadge';
import { format } from 'date-fns';
import Image from 'next/image';

interface Props {
  game: Game;
  hideLeague?: boolean;
}

// ── Club crest colors ─────────────────────────────────────────────────────────

const CLUB_COLORS: Record<string, { bg: string; text: string }> = {
  'Everton':            { bg: '#eef1fb', text: '#003399' },
  'Liverpool':          { bg: '#fbeef0', text: '#C8102E' },
  'Manchester United':  { bg: '#fbeef0', text: '#DA291C' },
  'Man United':         { bg: '#fbeef0', text: '#DA291C' },
  'Manchester City':    { bg: '#eef4fb', text: '#1c55a6' },
  'Man City':           { bg: '#eef4fb', text: '#1c55a6' },
  'Arsenal':            { bg: '#fbeef0', text: '#EF0107' },
  'Tottenham Hotspur':  { bg: '#eef0f8', text: '#132257' },
  'Tottenham':          { bg: '#eef0f8', text: '#132257' },
  'Spurs':              { bg: '#eef0f8', text: '#132257' },
  'Chelsea':            { bg: '#eef1fb', text: '#034694' },
  'Brighton':           { bg: '#eef1fb', text: '#0057B8' },
  'Brighton & Hove Albion': { bg: '#eef1fb', text: '#0057B8' },
  'Aston Villa':        { bg: '#f5eef8', text: '#95BFE5' },
  'West Ham':           { bg: '#fbeef0', text: '#7A263A' },
  'West Ham United':    { bg: '#fbeef0', text: '#7A263A' },
};
const CREST_FALLBACK = { bg: '#f5f5f4', text: '#555553' };

function crestColors(name?: string) {
  if (!name) return CREST_FALLBACK;
  for (const [key, val] of Object.entries(CLUB_COLORS)) {
    if (name.includes(key)) return val;
  }
  return CREST_FALLBACK;
}

const LEAGUE_ABBR: Record<number, string> = {
  39: 'EPL', 754: 'WSL', 2: 'UCL', 3: 'UEL', 848: 'UECL',
  5: 'UWCL', 140: 'La Liga', 135: 'Serie A', 78: 'Bundesliga',
  61: 'Ligue 1', 253: 'MLS', 1: 'World Cup', 4: 'Euros',
  9: 'Copa América', 8: "Women's WC",
};

function leagueLabel(id: number, name: string): string {
  return LEAGUE_ABBR[id] ?? name;
}

// ── Football card ─────────────────────────────────────────────────────────────

function FootballCard({ game }: { game: Game }) {
  const time = format(new Date(game.startTime), 'HH:mm');
  // Score shown only when live or finished — never for upcoming
  const showScore = game.status !== 'upcoming'
    && game.homeScore !== undefined
    && game.awayScore !== undefined;

  const rows = [
    { team: game.homeTeam, score: game.homeScore, opp: game.awayScore },
    { team: game.awayTeam, score: game.awayScore, opp: game.homeScore },
  ];

  return (
    <>
      <div className="card-meta">
        <span className="league-badge">{leagueLabel(game.league.id, game.league.name)}</span>
        <LiveBadge status={game.status} label={game.statusLabel} startTime={game.startTime} time={time} />
      </div>

      <div className="match-teams" style={game.status === 'live' ? { paddingRight: 9 } : undefined}>
        {rows.map(({ team, score, opp }, i) => {
          const colors = crestColors(team?.name);
          const losing = showScore && score !== undefined && opp !== undefined && score < opp;
          return (
            <div key={i} className="team-row">
              <div className="team-info">
                {team?.logo ? (
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={20}
                    height={20}
                    unoptimized
                    style={{ width: 20, height: 20 }}
                    className="object-contain shrink-0"
                  />
                ) : (
                  <div
                    className="team-crest"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {team?.name?.[0] ?? '?'}
                  </div>
                )}
                <span className="team-name">{team?.name}</span>
              </div>
              {showScore && (
                <span className={`score-value${losing ? ' dim' : ''}`}>{score}</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Tennis card ───────────────────────────────────────────────────────────────

function TennisCard({ game, hideLeague }: { game: Game; hideLeague?: boolean }) {
  const time = format(new Date(game.startTime), 'HH:mm');
  const showScore = game.status !== 'upcoming' && !!game.score;

  const sets: [number, number][] = [];
  if (showScore && game.score) {
    for (const part of game.score.split(',')) {
      const [a, b] = part.trim().replace('*', '').split('-').map(Number);
      if (!isNaN(a) && !isNaN(b)) sets.push([a, b]);
    }
  }

  const tournamentName = game.league.name.replace(/\s+(presented|sponsored|powered|supported)\s+by\b.*/i, '').trim();
  const stagePart = game.stage ?? null;
  const badgeLabel = hideLeague
    ? stagePart
    : stagePart ? `${tournamentName} · ${stagePart}` : tournamentName;

  const players = [
    { player: game.player1, serving: game.serving === 1 },
    { player: game.player2, serving: game.serving === 2 },
  ];

  return (
    <>
      <div className="card-meta">
        {badgeLabel ? <span className="league-badge">{badgeLabel}</span> : <span />}
        <LiveBadge status={game.status} label={game.statusLabel} startTime={game.startTime} time={time} />
      </div>

      <div className="tennis-body" style={game.status === 'live' ? { paddingRight: 9 } : undefined}>
        <div className="players-col">
          {players.map(({ player, serving }, i) => (
            <div key={i} className="player-row">
              {player?.flag && (
                <Image
                  src={player.flag}
                  alt={player.country}
                  width={14}
                  height={10}
                  unoptimized
                  style={{ width: 14, height: 'auto' }}
                  className="rounded-sm shrink-0 opacity-80"
                />
              )}
              <span className="player-surname">
                {player?.name?.split(' ').pop() ?? 'TBD'}
              </span>
              {serving && (
                <span style={{ fontSize: 6, color: '#d97706', lineHeight: 1 }}>●</span>
              )}
            </div>
          ))}
        </div>

        <div className="sets-cols">
          {showScore && sets.length > 0 && sets.map(([s1, s2], i) => (
            <div key={i} className="set-col">
              <span className={`score-value${s1 <= s2 ? ' dim' : ''}`}>{s1}</span>
              <span className={`score-value${s2 <= s1 ? ' dim' : ''}`}>{s2}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Card shell ────────────────────────────────────────────────────────────────

export default function GameCard({ game, hideLeague }: Props) {
  const sportClass = game.sport === 'soccer' ? 'football-card' : 'tennis-card';

  return (
    <div className={`game-card ${sportClass}`}>
      {game.sport === 'soccer'
        ? <FootballCard game={game} />
        : <TennisCard game={game} hideLeague={hideLeague} />
      }
    </div>
  );
}
