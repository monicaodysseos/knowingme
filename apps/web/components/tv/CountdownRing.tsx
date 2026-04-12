'use client';

import { useEffect, useState } from 'react';

interface Props {
  timerEnd: number;
  totalSeconds: number;
  size?: number;
  strokeWidth?: number;
}

export default function CountdownRing({
  timerEnd,
  totalSeconds,
  size = 120,
  strokeWidth = 8,
}: Props) {
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

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const progress = Math.max(0, remaining / totalSeconds);
  const offset = circumference * (1 - progress);

  const danger = remaining <= 10 && remaining > 0;

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
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="#1e1e3a"
          strokeWidth={strokeWidth}
        />
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
