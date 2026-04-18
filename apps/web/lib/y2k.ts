// Y2K Design System tokens

export const Y2K = {
  // Light pastel TV background — radial pink/blue gradients on a soft purple-blue base
  bg: 'radial-gradient(ellipse at 20% 10%, #ffd6f0 0%, transparent 45%), radial-gradient(ellipse at 80% 90%, #c7eaff 0%, transparent 50%), linear-gradient(160deg, #f7c4e7 0%, #c0d9ff 45%, #d4f1ff 100%)',
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
