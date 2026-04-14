'use client';

import type { PlayerCharacter } from '@ksero-se/types';

interface Props {
  shape: PlayerCharacter;
  color: string;
  size?: number;
}

export default function CharacterShape({ shape, color, size = 48 }: Props) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  // Shared face features — dots and smile scaled to size
  const eyeR = s * 0.055;
  const eyeY = cy - s * 0.08;
  const eyeOffX = s * 0.13;
  const smileR = s * 0.14;
  const smileY = cy + s * 0.09;

  const face = (
    <>
      <circle cx={cx - eyeOffX} cy={eyeY} r={eyeR} fill="white" opacity={0.9} />
      <circle cx={cx + eyeOffX} cy={eyeY} r={eyeR} fill="white" opacity={0.9} />
      <path
        d={`M ${cx - smileR} ${smileY} Q ${cx} ${smileY + smileR} ${cx + smileR} ${smileY}`}
        stroke="white"
        strokeWidth={s * 0.05}
        strokeLinecap="round"
        fill="none"
        opacity={0.9}
      />
    </>
  );

  const shapes: Record<PlayerCharacter, JSX.Element> = {
    blob: (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <ellipse
          cx={cx} cy={cy}
          rx={cx * 0.88} ry={cy * 0.92}
          fill={color}
        />
        {face}
      </svg>
    ),

    star: (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polygon
          points={starPoints(cx, cy, s * 0.46, s * 0.2, 5)}
          fill={color}
        />
        {face}
      </svg>
    ),

    diamond: (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polygon
          points={`${cx},${s * 0.06} ${s * 0.92},${cy} ${cx},${s * 0.94} ${s * 0.08},${cy}`}
          fill={color}
        />
        {face}
      </svg>
    ),

    cloud: (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <g fill={color}>
          <circle cx={cx} cy={cy + s * 0.04} r={s * 0.3} />
          <circle cx={cx - s * 0.2} cy={cy + s * 0.1} r={s * 0.22} />
          <circle cx={cx + s * 0.2} cy={cy + s * 0.1} r={s * 0.22} />
          <circle cx={cx - s * 0.08} cy={cy - s * 0.1} r={s * 0.24} />
          <circle cx={cx + s * 0.1} cy={cy - s * 0.08} r={s * 0.2} />
        </g>
        {face}
      </svg>
    ),

    hex: (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polygon
          points={hexPoints(cx, cy, s * 0.44)}
          fill={color}
        />
        {face}
      </svg>
    ),

    drop: (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <path
          d={`M ${cx} ${s * 0.05}
              C ${cx + s * 0.36} ${s * 0.3} ${cx + s * 0.38} ${s * 0.55}
                ${cx} ${s * 0.93}
              C ${cx - s * 0.38} ${s * 0.55} ${cx - s * 0.36} ${s * 0.3}
                ${cx} ${s * 0.05} Z`}
          fill={color}
        />
        {face}
      </svg>
    ),

    shield: (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <path
          d={`M ${cx} ${s * 0.05}
              L ${s * 0.9} ${s * 0.18}
              L ${s * 0.9} ${s * 0.52}
              Q ${cx} ${s * 0.97} ${s * 0.1} ${s * 0.52}
              L ${s * 0.1} ${s * 0.18} Z`}
          fill={color}
        />
        {face}
      </svg>
    ),

    crown: (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <path
          d={`M ${s * 0.1} ${s * 0.72}
              L ${s * 0.1} ${s * 0.32}
              L ${cx} ${s * 0.58}
              L ${cx} ${s * 0.18}
              L ${cx} ${s * 0.42}
              L ${s * 0.9} ${s * 0.18}
              L ${s * 0.9} ${s * 0.32}
              L ${s * 0.9} ${s * 0.72} Z`}
          fill={color}
        />
        {/* base bar */}
        <rect x={s * 0.08} y={s * 0.72} width={s * 0.84} height={s * 0.12} rx={s * 0.04} fill={color} />
        {face}
      </svg>
    ),
  };

  return shapes[shape] ?? shapes.blob;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function starPoints(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += `${x},${y} `;
  }
  return d.trim();
}

function hexPoints(cx: number, cy: number, r: number): string {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    d += `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)} `;
  }
  return d.trim();
}
