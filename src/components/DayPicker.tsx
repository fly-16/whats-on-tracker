'use client';

import { format, addDays, subDays, isToday } from 'date-fns';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  date: Date;
  onChange: (date: Date) => void;
}

const WINDOW = 6;    // days visible at once
const MAX_PAST = 7;  // how far back (in days) the user can scroll

export default function DayPicker({ date, onChange }: Props) {
  const today = new Date();
  // windowOffset: steps forward from the earliest allowed day (today - MAX_PAST)
  // Default offset = MAX_PAST - 1 so the initial window starts at yesterday
  const [windowOffset, setWindowOffset] = useState(MAX_PAST - 1);

  const windowStart = addDays(subDays(today, MAX_PAST), windowOffset);
  const days = Array.from({ length: WINDOW }, (_, i) => addDays(windowStart, i));

  const canGoBack = windowOffset > 0;

  return (
    <div className="date-strip">
      <button
        className="day-nav-btn"
        onClick={() => setWindowOffset(o => Math.max(0, o - 1))}
        disabled={!canGoBack}
        aria-label="Previous days"
      >
        <ChevronLeft size={14} />
      </button>

      {days.map(d => {
        const active = format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        const todayDay = isToday(d);
        return (
          <button
            key={format(d, 'yyyy-MM-dd')}
            onClick={() => onChange(d)}
            className={[
              'day-pill',
              active ? 'active' : '',
              todayDay ? 'is-today' : '',
            ].filter(Boolean).join(' ')}
          >
            <span className="dow">{todayDay ? 'Today' : format(d, 'EEE')}</span>
            <span className="dom">{format(d, 'd')}</span>
          </button>
        );
      })}

      <button
        className="day-nav-btn"
        onClick={() => setWindowOffset(o => o + 1)}
        aria-label="Next days"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
