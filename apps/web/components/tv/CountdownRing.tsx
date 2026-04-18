'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  timerEnd: number;
  totalSeconds: number;
  size?: number;
  strokeWidth?: number;
  beep?: () => void;
}

export default function CountdownRing({
  timerEnd,
  totalSeconds,
  size = 120,
  strokeWidth = 8,
  beep,
}: Props) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const lastBeepedAt = useRef<number>(-1);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setRemaining(diff);

      // Fire beep exactly once per second for the last 5 seconds
      if (beep && diff <= 5 && diff > 0 && diff !== lastBeepedAt.current) {
        lastBeepedAt.current = diff;
        beep();
      }
    };
    lastBeepedAt.current = -1;
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [timerEnd, beep]);

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const progress = Math.max(0, remaining / totalSeconds);
  const offset = circumference * (1 - progress);

  const danger = remaining <= 5 && remaining > 0;

  const colour =
    remaining > 20
      ? '#0DD3C5'
      : remaining > 10
      ? '#F59E0B'
      : '#ef4444';

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#1e1e3a" strokeWidth={strokeWidth} />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.5s ease' }}
        />
      </svg>
      <span
        className={`absolute font-black tabular-nums ${danger ? 'timer-danger' : ''}`}
        style={{ fontSize: size * 0.3, color: colour }}
      >
        {remaining}
      </span>
    </div>
  );
}
