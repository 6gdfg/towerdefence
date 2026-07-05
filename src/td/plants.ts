import { ElementType, PlantType } from './types';

export interface BasePlantConfig {
  id: PlantType;
  name: string;
  icon: string;
  cost: number;
  placementCooldown?: number;
  range: number;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  penetration?: boolean;
  pierceLimit?: number;
  damageDecayFactor?: number;
  activeAbilityCost?: number;
  incomeInterval?: number;
  incomeBase?: number;
  incomeBonusPerLevel?: number;
  description: string;
}

export interface ElementConfig {
  id: ElementType;
  name: string;
  description: string;
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
  bounce?: {
    maxBounces: number;
  };
}

export const DEFAULT_PLANT_COLOR = '#d1d5db'; // 灰色
export const DEFAULT_BULLET_COLOR = '#9ca3af'; // 灰色

export const BASE_PLANTS_CONFIG: Record<PlantType, BasePlantConfig> = {
  sunflower: {
    id: 'sunflower',
    name: '金盏花',
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
    cost: 80,
    range: 3.2,
    damage: 26,
    fireRate: 1.2,
    projectileSpeed: 8,
    description: '单体攻击，综合性能均衡。',
  },
  puffShroom: {
    id: 'puffShroom',
    name: '小喷菇',
    icon: '□',
    cost: 0,
    placementCooldown: 7,
    range: 3.2,
    damage: 26,
    fireRate: 1.2,
    projectileSpeed: 8,
    description: '免费放置，放置后需要短暂冷却；其余性能与瓶子草相同。',
  },
  fourLeafClover: {
    id: 'fourLeafClover',
    name: '四叶草',
    icon: '🍀',
    cost: 270,
    range: 3.8,
    damage: 21,
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
    fireRate: 4.5,
    projectileSpeed: 9,
    description: '攻速极快，单发伤害较低。',
  },
  sniper: {
    id: 'sniper',
    name: '狙击手',
    icon: '▸',
    cost: 250,
    range: 99,
    damage: 250,
    fireRate: 0.36,
    projectileSpeed: 14,
    description: '射程覆盖整张地图，伤害高但攻速极慢。',
  },
  rocket: {
    id: 'rocket',
    name: '火箭',
    icon: '◆',
    cost: 250,
    range: 6.5,
    damage: 26,
    fireRate: 1.2,
    projectileSpeed: 10,
    penetration: true,
    pierceLimit: 5,
    damageDecayFactor: 0.8,
    description: '穿透型火箭，命中目标后伤害逐次递减，仅能命中有限数量敌人。',
  },
  sunlightFlower: {
    id: 'sunlightFlower',
    name: '日光花',
    icon: '▣',
    cost: 10,
    range: 3.2,
    damage: 30,
    fireRate: 0,
    projectileSpeed: 8,
    activeAbilityCost: 10,
    description: '主动技能植物：点击时消耗10金币发射高伤害子弹，平时不会自动攻击。',
  },
};

export const ELEMENT_PLANT_CONFIG: Record<ElementType, ElementConfig> = {
  gold: {
    id: 'gold',
    name: '金元素',
    description: '攻击时概率破甲，大幅增加后续伤害。',
    cost: 100,
    color: '#fbbf24',
    bulletColor: '#f59e0b',
    fireRatePenalty: 0.5,
    breakArmor: {
      multiplier: 1.5,
      bonusPerLevel: 0.1,
      duration: 10,
    },
  },
  fire: {
    id: 'fire',
    name: '火元素',
    description: '攻击附加灼烧效果，持续造成伤害。',
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
    description: '攻击时产生小范围溅射伤害。',
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
    description: '攻击附加减速效果。',
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
    description: '植物周围产生光环，持续对范围内敌人造成伤害，并附加击退效果。',
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
  light: {
    id: 'light',
    name: '光元素',
    description: '子弹在失去目标后会继续飞行并可反弹，最多反弹5次。',
    cost: 80,
    color: '#fde047',
    bulletColor: '#facc15',
    bounce: {
      maxBounces: 5,
    },
  },
};

export const SUNFLOWER_ELEMENT_BLOCKLIST = new Set<ElementType>(['gold', 'fire', 'electric', 'ice', 'wind', 'light']);

const TOWER_LEVEL_CONFIG = { damagePerLevel: 0.05, rangePerLevel: 0.01, fireRatePerLevel: 0.02 } as const;

export function scalePlantStats(base: BasePlantConfig, level: number) {
  const lv = Math.max(1, Math.floor(level || 1));
  const dmgMul = 1 + (lv - 1) * TOWER_LEVEL_CONFIG.damagePerLevel;
  const rngMul = 1 + (lv - 1) * TOWER_LEVEL_CONFIG.rangePerLevel;
  const frMul = 1 + (lv - 1) * TOWER_LEVEL_CONFIG.fireRatePerLevel;
  return {
    damage: Number((base.damage * dmgMul).toFixed(2)),
    range: Number((base.range * rngMul).toFixed(2)),
    fireRate: base.fireRate === 0 ? 0 : Number((base.fireRate * frMul).toFixed(2)),
  };
}

export function computePlantStats(base: BasePlantConfig, level: number, element?: { type: ElementType; level: number }) {
  const scaled = scalePlantStats(base, level);
  let damage = scaled.damage;
  let range = scaled.range;
  let fireRate = scaled.fireRate;
  const projectileSpeed = base.projectileSpeed;
  let penetration = !!base.penetration;
  let color = DEFAULT_PLANT_COLOR;
  let bulletColor = DEFAULT_BULLET_COLOR;

  if (element) {
    const elementCfg = ELEMENT_PLANT_CONFIG[element.type];
    if (elementCfg) {
      if (elementCfg.fireRateMultiplier != null) {
        fireRate = Number((fireRate * elementCfg.fireRateMultiplier).toFixed(2));
      }
      if (elementCfg.fireRatePenalty != null) {
        fireRate = Math.max(0.1, Number((fireRate - elementCfg.fireRatePenalty).toFixed(2)));
      }
      let damageMul = elementCfg.damageMultiplier ?? 1;
      if (elementCfg.damageBonusPerLevel) {
        damageMul += elementCfg.damageBonusPerLevel * (element.level - 1);
      }
      damage = Number((damage * damageMul).toFixed(2));
      penetration = penetration || !!elementCfg.penetration;
      color = elementCfg.color;
      bulletColor = elementCfg.bulletColor;
    }
  }

  return { damage, range, fireRate, projectileSpeed, penetration, color, bulletColor };
}

export function getPlantStatsForLevel(type: PlantType, level: number) {
  const base = BASE_PLANTS_CONFIG[type];
  if (!base) return null;
  const stats = computePlantStats(base, level);
  return {
    ...stats,
    pierceLimit: base.pierceLimit,
    damageDecayFactor: base.damageDecayFactor,
    activeAbilityCost: base.activeAbilityCost,
  };
}
