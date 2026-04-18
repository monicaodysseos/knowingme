'use client';

import type { ReactNode } from 'react';
import { Y2K } from '../../lib/y2k';

interface Props {
  children: ReactNode;
  accent?: string;
}

export default function PhoneLayout({ children, accent = Y2K.hotPink }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col safe-top safe-bottom safe-left safe-right"
      style={{ background: Y2K.cream }}
    >
      {/* Y2K gradient top bar */}
      <div
        style={{
          height: 10,
          flexShrink: 0,
          background: `linear-gradient(90deg, ${accent}, ${Y2K.yellow})`,
          borderBottom: `2px solid ${Y2K.dark}`,
        }}
      />
      <div className="flex-1 flex flex-col px-5 py-4">{children}</div>
    </div>
  );
}
