// One roster for the eight characters. Art stays in the web avatar
// component, paired with these names, so a later branded drawing can
// replace a slot without a hunt through the game.

export const CHARACTER_ROSTER = [
  { id: 'blob', name: 'alien', art: 'alien' },
  { id: 'star', name: 'ghost', art: 'ghost' },
  { id: 'diamond', name: 'frog', art: 'frog' },
  { id: 'cloud', name: 'bunny', art: 'bunny' },
  { id: 'hex', name: 'shroom', art: 'mushroom' },
  { id: 'drop', name: 'robot', art: 'robot' },
  { id: 'shield', name: 'melt', art: 'melt' },
  { id: 'crown', name: 'tamago', art: 'tamago' },
] as const;

export const PLAYER_CHARACTERS = [
  'blob', 'star', 'diamond', 'cloud', 'hex', 'drop', 'shield', 'crown',
] as const;

export type PlayerCharacter = (typeof PLAYER_CHARACTERS)[number];

export type CharacterArt = (typeof CHARACTER_ROSTER)[number]['art'];

export function characterName(id: string): string {
  const slot = CHARACTER_ROSTER.find((item) => item.id === id);
  return slot ? slot.name : 'ghost';
}
