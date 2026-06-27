'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Y2K } from '../lib/y2k';

/** On-brand loading indicator: three bouncing Y2K dots + optional label.
 *  Honours prefers-reduced-motion (dots hold still). */
export default function Loader({ label, dark = false }: { label?: string; dark?: boolean }) {
  const reduce = useReducedMotion();
  const colors = [Y2K.hotPink, Y2K.cyan, Y2K.yellow];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {colors.map((c, i) => (
          <motion.span
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: c,
              border: `2px solid ${Y2K.dark}`,
              boxShadow: `0 3px 0 ${Y2K.dark}`,
              display: 'block',
            }}
            animate={reduce ? undefined : { y: [0, -14, 0] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
          />
        ))}
      </div>
      {label && (
        <p
          style={{
            fontFamily: Y2K.display,
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: 0.5,
            color: dark ? Y2K.dark : '#fff',
          }}
        >
          {label}
        </p>
      )}
    </div>
  );
}
