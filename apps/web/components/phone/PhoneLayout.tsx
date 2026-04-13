'use client';

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  accent?: string;
}

export default function PhoneLayout({ children, accent = '#F97316' }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col safe-top safe-bottom safe-left safe-right"
      style={{ background: '#FFF5E0' }}
    >
      {/* Top accent bar — thicker and more vivid */}
      <div
        className="h-2 w-full flex-shrink-0"
        style={{ background: `linear-gradient(90deg, ${accent}, #FFD23F)` }}
      />
      <div className="flex-1 flex flex-col px-5 py-4">{children}</div>
    </div>
  );
}
