'use client';

import { motion } from 'framer-motion';

interface Props {
  message: string;
}

const DOTS = ['●', '●', '●'];

export default function PhoneWaiting({ message }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
      {/* Animated dots */}
      <div className="flex gap-2">
        {DOTS.map((d, i) => (
          <motion.span
            key={i}
            className="text-3xl"
            style={{ color: '#8B5CF6' }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          >
            {d}
          </motion.span>
        ))}
      </div>
      <p className="text-gray-300 font-bold text-xl max-w-xs leading-relaxed">{message}</p>
    </div>
  );
}
