// Y2K Design System tokens

export const Y2K = {
  pink:     '#FF4FB4',
  hotPink:  '#FF1E8E',
  deepPink: '#A8167A',
  cyan:     '#00D5FF',
  yellow:   '#FFE24A',
  dark:     '#0b0429',
  cream:    '#FFF5DA',
  display:  "'Rubik', 'Nunito', sans-serif",
  body:     "'Space Grotesk', 'Nunito', sans-serif",
} as const;

// Map PlayerCharacter ids → Y2K creature ids
export const AVATAR_MAP: Record<string, string> = {
  star:    'ghost',
  blob:    'alien',
  diamond: 'frog',
  cloud:   'bunny',
  hex:     'mushroom',
  drop:    'robot',
  shield:  'melt',
  crown:   'tamago',
};
