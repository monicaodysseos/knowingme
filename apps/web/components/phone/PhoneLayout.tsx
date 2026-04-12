'use client';

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  accent?: string;
}

export default function PhoneLayout({ children, accent = '#8B5CF6' }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col safe-top safe-bottom safe-left safe-right"
      style={{ background: '#0d0d1a' }}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full flex-shrink-0" style={{ background: accent }} />
      <div className="flex-1 flex flex-col px-5 py-4">{children}</div>
    </div>
  );
}
