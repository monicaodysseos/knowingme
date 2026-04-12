'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  tx: number;
  ty: number;
  colour: string;
  size: number;
  delay: number;
}

const COLOURS = ['#8B5CF6', '#0DD3C5', '#F59E0B', '#FF6B6B', '#38BDF8', '#84CC16', '#EC4899'];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export default function ParticleBurst({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const ps: Particle[] = Array.from({ length: 36 }, (_, i) => ({
      id: Date.now() + i,
      tx: randomBetween(-120, 120),
      ty: randomBetween(-120, 120),
      colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
      size: randomBetween(6, 14),
      delay: Math.random() * 0.2,
    }));
    setParticles(ps);
    const t = setTimeout(() => setParticles([]), 1200);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full particle"
          style={{
            width: p.size,
            height: p.size,
            background: p.colour,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            animationDelay: `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
