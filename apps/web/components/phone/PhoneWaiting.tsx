'use client';

import { motion } from 'framer-motion';
import { Y2K } from '../../lib/y2k';

interface Props {
  message: string;
}

export default function PhoneWaiting({ message }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4">
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: Y2K.hotPink,
              border: `2px solid ${Y2K.dark}`,
            }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <p style={{
        fontFamily: Y2K.display,
        fontWeight: 800,
        fontSize: 18,
        color: Y2K.dark,
        maxWidth: 260,
        lineHeight: 1.4,
        letterSpacing: '-0.3px',
      }}>
        {message}
      </p>
      <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 12, color: '#3a1555' }}>
        watch the tv ☆
      </p>
    </div>
  );
}
