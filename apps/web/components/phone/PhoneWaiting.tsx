'use client';

import { motion } from 'framer-motion';

interface Props {
  message: string;
}

export default function PhoneWaiting({ message }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full"
            style={{ background: '#F97316' }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <p className="font-bold text-gray-700 text-xl max-w-xs leading-relaxed">{message}</p>
    </div>
  );
}
