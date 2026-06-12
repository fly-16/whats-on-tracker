'use client';

import { format, addDays, subDays, isToday } from 'date-fns';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  date: Date;
  onChange: (date: Date) => void;
}

const DESKTOP_WINDOW = 6; // days visible at once on desktop
const MOBILE_WINDOW = 3;  // fewer days on mobile to leave room for the view switcher
const MAX_PAST = 7;       // how far back (in days) the user can scroll

export default function DayPicker({ date, onChange }: Props) {
  const today = new Date();
  // windowOffset: steps forward from the earliest allowed day (today - MAX_PAST)
  // Default offset = MAX_PAST - 1 so the initial window starts at yesterday
  const [windowOffset, setWindowOffset] = useState(MAX_PAST - 1);

  // Match the CSS breakpoint so mobile shows fewer day pills
  const [windowSize, setWindowSize] = useState(DESKTOP_WINDOW);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setWindowSize(mq.matches ? MOBILE_WINDOW : DESKTOP_WINDOW);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const windowStart = addDays(subDays(today, MAX_PAST), windowOffset);
  const days = Array.from({ length: windowSize }, (_, i) => addDays(windowStart, i));

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
