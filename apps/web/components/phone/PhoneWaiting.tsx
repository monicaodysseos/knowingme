'use client';

import { motion } from 'framer-motion';
import { Y2K } from '../../lib/y2k';

interface Props {
  message: string;
}

const TV_ICON = (
  <svg width="48" height="40" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="44" height="30" rx="5" fill={Y2K.dark} stroke={Y2K.hotPink} strokeWidth="2.5"/>
    <rect x="7" y="7" width="34" height="20" rx="2.5" fill={Y2K.hotPink} opacity="0.18"/>
    <rect x="7" y="7" width="34" height="20" rx="2.5" stroke={Y2K.hotPink} strokeWidth="1.5"/>
    {/* Screen glare */}
    <rect x="9" y="9" width="8" height="3" rx="1.5" fill="white" opacity="0.35"/>
    {/* Legs */}
    <rect x="16" y="32" width="4" height="6" rx="1.5" fill={Y2K.dark}/>
    <rect x="28" y="32" width="4" height="6" rx="1.5" fill={Y2K.dark}/>
    {/* Stand base */}
    <rect x="12" y="37" width="24" height="2.5" rx="1.25" fill={Y2K.dark}/>
  </svg>
);

const LOOK_AT_TV_MESSAGE = 'Look at the TV for instructions you fool!';

export default function PhoneWaiting({ message }: Props) {
  const isLookAtTV = message === LOOK_AT_TV_MESSAGE;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4">
      {isLookAtTV ? (
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [-3, 3, -3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {TV_ICON}
        </motion.div>
      ) : (
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
      )}
      <p style={{
        fontFamily: Y2K.display,
        fontWeight: 800,
        fontSize: isLookAtTV ? 20 : 18,
        color: Y2K.dark,
        maxWidth: 260,
        lineHeight: 1.4,
        letterSpacing: '-0.3px',
      }}>
        {message}
      </p>
      {!isLookAtTV && (
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 12, color: '#3a1555' }}>
          watch the tv ☆
        </p>
      )}
    </div>
  );
}
