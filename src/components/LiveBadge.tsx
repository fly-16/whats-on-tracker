'use client';

import { GameStatus } from '@/types';

interface Props {
  status: GameStatus;
  label: string;
  startTime: string;
  time: string; // formatted HH:mm, always shown
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export default function LiveBadge({ status, label, startTime, time }: Props) {
  const labelUpper = label.toUpperCase();
  const isActuallyLive = status === 'live'
    && !labelUpper.includes('FINISH')
    && labelUpper !== 'FT';

  if (isActuallyLive) {
    return (
      <span className="status-live">
        <span className="pulse-dot" />
        live
      </span>
    );
  }

  if (status === 'finished') {
    return <span className="status-finished">{label}</span>;
  }

  if (status === 'upcoming') {
    const minsUntil = new Date(startTime).getTime() - Date.now();
    if (minsUntil <= TWO_HOURS_MS) {
      return <span className="status-pill upcoming">{time}</span>;
    }
  }

  // default — plain time
  return <span className="match-time">{time}</span>;
}
