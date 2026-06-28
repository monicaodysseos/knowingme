'use client';

import { useState, useEffect } from 'react';
import { Y2K } from '../../lib/y2k';

/** A "next in Ns" countdown + a continue button (shown when onContinue is given).
 *  Used on the result/scoreboard holds so the host can advance early. */
export default function ContinueBar({ timerEnd, onContinue, label = 'continue ▶' }: { timerEnd: number; onContinue?: () => void; label?: string }) {
  const [secs, setSecs] = useState(() => Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000)));
  useEffect(() => {
    const iv = setInterval(() => setSecs(Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000))), 500);
    return () => clearInterval(iv);
  }, [timerEnd]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(10px, 1.5vw, 20px)' }}>
      {timerEnd > 0 && (
        <span style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 'clamp(12px, 1.4vw, 18px)', color: Y2K.dark, opacity: 0.65 }}>
          next in {secs}s
        </span>
      )}
      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="y2k-hover-lift"
          style={{
            fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(15px, 1.8vw, 24px)', color: '#fff',
            background: Y2K.hotPink, border: `3px solid ${Y2K.dark}`, borderRadius: 999,
            padding: 'clamp(8px, 1vh, 14px) clamp(20px, 2.5vw, 36px)', boxShadow: `0 5px 0 ${Y2K.dark}`,
            cursor: 'pointer', WebkitTextStroke: `0.5px ${Y2K.dark}`, letterSpacing: '0.03em',
          }}
        >
          {label}
        </button>
      )}
    </div>
  );
}
