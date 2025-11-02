import { ElementType, PlantType } from './types';

export interface BasePlantConfig {
  id: PlantType;
  name: string;
  icon: string;
  cost: number;
  range: number;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  penetration?: boolean;
  incomeInterval?: number;
  incomeBase?: number;
  incomeBonusPerLevel?: number;
  description: string;
}

export interface ElementConfig {
  id: ElementType;
  name: string;
  cost: number;
  color: string;
  bulletColor: string;
  fireRateMultiplier?: number;
  fireRatePenalty?: number;
  damageMultiplier?: number;
  damageBonusPerLevel?: number;
  penetration?: boolean;
  breakArmor?: {
    multiplier: number;
    bonusPerLevel: number;
    duration: number;
  };
  burn?: {
    damagePerSecond: number;
    bonusPerLevel: number;
    duration: number;
  };
  splash?: {
    radius: number;
    damagePercent: number;
    bonusPerLevel: number;
  };
  slow?: {
    pct: number;
    duration: number;
  };
  knockback?: {
    distance: number;
  };
  aura?: {
    damagePerSecond: number;
    bonusPerLevel: number;
  };
}

export const DEFAULT_PLANT_COLOR = '#d1d5db'; // 灰色
export const DEFAULT_BULLET_COLOR = '#9ca3af'; // 灰色

export const BASE_PLANTS_CONFIG: Record<PlantType, BasePlantConfig> = {
  sunflower: {
    id: 'sunflower',
    name: '向日葵',
    icon: '★',
    cost: 50,
    range: 0,
    damage: 0,
    fireRate: 0,
    projectileSpeed: 0,
    incomeInterval: 10,
    incomeBase: 10,
    incomeBonusPerLevel: 1,
    description: '每10秒自动产出金币，可升级提高产量，无攻击能力。',
  },
  bottleGrass: {
    id: 'bottleGrass',
    name: '瓶子草',
    icon: '⚱',
    cost: 100,
    range: 3.2,
    damage: 26,
    fireRate: 1.2,
    projectileSpeed: 8,
    description: '单体攻击，综合性能均衡。',
  },
  fourLeafClover: {
    id: 'fourLeafClover',
    name: '四叶草',
    icon: '🍀',
    cost: 300,
    range: 3.8,
    damage: 24,
    fireRate: 1.0,
    projectileSpeed: 9,
    penetration: true,
    description: '子弹直线穿透敌人，射程略长。',
  },
  machineGun: {
    id: 'machineGun',
    name: '机枪',
    icon: '▲',
    cost: 300,
    range: 3.0,
    damage: 10,
    fireRate: 3.5,
    projectileSpeed: 9,
    description: '攻速极快，单发伤害较低。',
  },
  sniper: {
    id: 'sniper',
    name: '狙击手',
    icon: '▸',
    cost: 250,
    range: 99,
    damage: 120,
    fireRate: 0.18,
    projectileSpeed: 14,
    description: '射程覆盖整张地图，伤害高但攻速极慢。',
  },
};

export const ELEMENT_PLANT_CONFIG: Record<ElementType, ElementConfig> = {
  gold: {
    id: 'gold',
    name: '金元素',
    cost: 100,
    color: '#fbbf24',
    bulletColor: '#f59e0b',
    fireRatePenalty: 1,
    breakArmor: {
      multiplier: 1.5,
      bonusPerLevel: 0.1,
      duration: 10,
    },
  },
  fire: {
    id: 'fire',
    name: '火元素',
    cost: 100,
    color: '#ef4444',
    bulletColor: '#dc2626',
    fireRateMultiplier: 1.2,
    damageMultiplier: 0.95,
    burn: {
      damagePerSecond: 5,
      bonusPerLevel: 3,
      duration: 4,
    },
  },
  electric: {
    id: 'electric',
    name: '电元素',
    cost: 100,
    color: '#8b5cf6',
    bulletColor: '#7c3aed',
    damageMultiplier: 0.95,
    splash: {
      radius: 1.3,
      damagePercent: 0.05,
      bonusPerLevel: 0.01,
    },
  },
  ice: {
    id: 'ice',
    name: '冰元素',
    cost: 80,
    color: '#3b82f6',
    bulletColor: '#2563eb',
    fireRateMultiplier: 0.95,
    damageMultiplier: 0.95,
    damageBonusPerLevel: 0.0125,
    slow: {
      pct: 0.5,
      duration: 2.5,
    },
  },
  wind: {
    id: 'wind',
    name: '风元素',
    cost: 150,
    color: '#10b981',
    bulletColor: '#059669',
    aura: {
      damagePerSecond: 1,
      bonusPerLevel: 0.5,
    },
    knockback: {
      distance: 0.7,
    },
  },
};

export const SUNFLOWER_ELEMENT_BLOCKLIST = new Set<ElementType>(['gold', 'fire', 'electric', 'ice', 'wind']);
