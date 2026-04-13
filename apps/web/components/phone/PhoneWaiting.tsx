'use client';

import { motion } from 'framer-motion';

interface Props {
  message: string;
}

const DOTS = ['●', '●', '●'];

export default function PhoneWaiting({ message }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
      <div className="flex gap-3">
        {DOTS.map((d, i) => (
          <motion.span
            key={i}
            style={{ color: '#F97316', fontSize: 28 }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
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
      <p className="font-bold text-gray-700 text-xl max-w-xs leading-relaxed">{message}</p>
    </div>
  );
}
