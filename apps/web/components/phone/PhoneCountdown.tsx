'use client';

import { useEffect, useState } from 'react';

interface Props {
  timerEnd: number;
  totalSeconds: number;
}

export default function PhoneCountdown({ timerEnd, totalSeconds }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setRemaining(diff);
    };
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [timerEnd]);

  const pct = Math.max(0, remaining / totalSeconds);
  const danger = remaining <= 10 && remaining > 0;
  const colour = remaining > 20 ? '#0DD3C5' : remaining > 10 ? '#F59E0B' : '#ef4444';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct * 100}%`,
            background: colour,
            transition: 'width 0.25s linear',
          }}
        />
      </div>
      <span
        className={`font-black tabular-nums text-2xl w-10 text-right ${danger ? 'timer-danger' : ''}`}
        style={{ color: colour }}
      >
        {remaining}
      </span>
    </div>
  );
}
