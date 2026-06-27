'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import { Y2K } from '../../lib/y2k';

/**
 * Scales its child down just enough to fit the viewport, so a TV (or any
 * screen) never clips content off the bottom/edges and a remote never needs to
 * scroll. When the content already fits, scale stays at 1 (no change).
 *
 * The child keeps its viewport-relative layout (it still renders at 100vw);
 * we only apply a uniform `transform: scale()`, which preserves the design and
 * letterboxes with the same Y2K background so the seams are invisible. A small
 * padding reserves a safe border against TV overscan.
 */
export default function FitScreen({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    let raf = 0;
    const recompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const availW = outer.clientWidth;   // viewport minus the safe padding
        const availH = outer.clientHeight;
        const cw = inner.offsetWidth;        // natural (pre-transform) size
        const ch = inner.offsetHeight;
        if (!cw || !ch) return;
        const next = Math.min(1, availW / cw, availH / ch);
        setScale((prev) => (Math.abs(prev - next) > 0.002 ? next : prev));
      });
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(inner);
    ro.observe(outer);
    window.addEventListener('resize', recompute);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, []);

  return (
    <div
      ref={outerRef}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: Y2K.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Safe border so TV overscan can't crop the content edges.
        padding: 'clamp(0px, 1.5vmin, 22px)',
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: '100vw',
          flexShrink: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
