import type { ShapeType } from './types';

export const INTRO_WIDTH = 1440;
export const INTRO_HEIGHT = 810;

export function fitIntroScale(width: number, height: number) {
  return Math.max(0, Math.min(width / INTRO_WIDTH, height / INTRO_HEIGHT));
}

export function getIntroMonsters(waves: readonly { groups: readonly { type: ShapeType; count: number }[] }[]) {
  const excluded = new Set<ShapeType>(['circle', 'square', 'triangle']);
  const monsters = new Set<ShapeType>();
  for (const wave of waves) {
    for (const group of wave.groups) {
      if (group.count > 0 && !excluded.has(group.type)) monsters.add(group.type);
      if (monsters.size === 12) return [...monsters];
    }
  }
  return [...monsters];
}
