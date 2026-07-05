import { MONSTER_BASE_STATS } from './levels';
import { ElementType, PlantType } from './types';

export const PLANT_TYPES: PlantType[] = ['sunflower', 'bottleGrass', 'puffShroom', 'fourLeafClover', 'machineGun', 'sniper', 'rocket', 'sunlightFlower'];
export const ELEMENT_TYPES: ElementType[] = ['fire', 'wind', 'ice', 'electric', 'gold', 'light'];

export const PLANT_UNLOCK_TARGETS: Record<number, PlantType> = {
  4: 'rocket',
  11: 'sunlightFlower',
};

export const STAR_LABELS: Record<1 | 2 | 3, string> = { 1: '一星', 2: '二星', 3: '三星' };

export const MONSTER_LABELS: Record<keyof typeof MONSTER_BASE_STATS, string> = {
  circle: '圆形怪',
  triangle: '三角怪',
  square: '方块怪',
  healer: '治疗者',
  evilSniper: '邪恶狙击手',
  rager: '狂暴者',
  summoner: '召唤者',
};
