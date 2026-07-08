import { MONSTER_BASE_STATS } from './levels';
import { ElementType, PlantType } from './types';

export const PLANT_TYPES: PlantType[] = ['sunflower', 'bottleGrass', 'doubleBottleGrass', 'puffShroom', 'fourLeafClover', 'machineGun', 'sniper', 'rocket', 'sunlightFlower', 'holyFlower', 'hotPepper', 'frostBlastShroom', 'cycloneShroom', 'magnetNeedle', 'electricFlower'];
export const ELEMENT_TYPES: ElementType[] = ['fire', 'wind', 'ice', 'electric', 'gold', 'light'];

export const STAR_LABELS: Record<1 | 2 | 3, string> = { 1: 'EZ', 2: 'HD', 3: 'IN' };

export const MONSTER_LABELS: Record<keyof typeof MONSTER_BASE_STATS, string> = {
  circle: '圆形怪',
  triangle: '三角怪',
  square: '方块怪',
  healer: '治疗者',
  evilSniper: '邪恶狙击手',
  rager: '狂暴者',
  summoner: '召唤者',
  igniter: '引燃怪',
  armored: '铁甲怪',
  iceShell: '冰壳怪',
  purifier: '净化使',
  angryWriter: '暴躁文学家',
  bunker: '碉堡',
};
