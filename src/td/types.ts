import { Position } from '../types/game';

export type ShapeType = 'circle' | 'triangle' | 'square' | 'healer' | 'evilSniper' | 'rager';

export interface Enemy {
  id: string;
  pos: Position;
  hp: number;
  maxHp: number;
  speed: number; // 格/秒
  shape: ShapeType;
  leakDamage: number; // 泄漏时对玩家造成的伤害（生命扣减）
  level?: number; // 怪物等级（显示用，可选，默认1）
  // 路径进度
  pathIndex: number; // 当前处于 path[pathIndex] -> path[pathIndex+1] 之间
  t: number; // [0,1)
  progress: number; // 全局进度，用于选取“最前进”目标
  pathId: number; // 该敌人所走的路径ID
  slowPct?: number;
  slowUntil?: number; // gameTime
  armorBreakMultiplier?: number;
  armorBreakUntil?: number;
  burnDamagePerSec?: number;
  burnUntil?: number;
  burnAccumulator?: number;
  knockbackX?: number;
  knockbackY?: number;
  knockbackUntil?: number;
  rewardGiven?: boolean;
  specialTimer?: number;
  speedBoostMultiplier?: number;
  speedBoostUntil?: number;
}

export type PlantType = 'sunflower' | 'bottleGrass' | 'fourLeafClover' | 'machineGun' | 'sniper' | 'rocket' | 'sunlightFlower';
export type ElementType = 'gold' | 'fire' | 'electric' | 'ice' | 'wind';

export type TowerType = PlantType;

export interface Tower {
  id: string;
  pos: Position;
  type: PlantType;
  level?: number; // 塔等级（默认1）
  range: number; // 格
  damage: number;
  fireRate: number; // 次/秒
  lastShotTime: number;
  splashRadius?: number;
  slowPct?: number;
  slowDuration?: number;
  projectileSpeed?: number;
  penetration?: boolean;
  color?: string;
  bulletColor?: string;
  incomeInterval?: number;
  incomeBase?: number;
  incomeBonusPerLevel?: number;
  lastIncomeTime?: number;
  element?: {
    type: ElementType;
    level: number;
    color: string;
    bulletColor: string;
  };
}

export interface Projectile {
  id: string;
  pos: Position;
  targetId?: string | null;
  speed: number; // 格/秒
  damage: number;
  from: PlantType;
  splashRadius?: number;
  slowPct?: number;
  slowDuration?: number;
  color?: string;
  direction?: { x: number; y: number };
  piercing?: boolean;
  pierced?: Record<string, boolean>;
  sourceTowerId?: string;
  breakArmorMultiplier?: number;
  breakArmorDuration?: number;
  burnDamagePerSec?: number;
  burnDuration?: number;
  splashPercent?: number;
  knockbackDistance?: number;
  pierceLimit?: number;
  pierceHitCount?: number;
  damageDecayFactor?: number;
}

export interface ElementCast {
  id: string;
  element: ElementType;
  pos: Position;
  triggerTime: number;
  level: number;
}

export interface DamagePopup {
  id: string;
  pos: Position;
  damage: number;
  color: string;
  until: number;
}

export interface WaveGroup {
  type: ShapeType;
  count: number;
  interval: number; // 秒
  level: number; // 怪物等级（决定HP和速度）
  reward: number; // 每只击杀奖励
  pathId?: number; // 指定走哪条路径（多路径地图）
  leakDamage?: number; // 泄漏伤害（默认1）
}

export interface WaveDef {
  groups: WaveGroup[];
}

export interface TDState {
  running: boolean;
  gameTime: number;
  gold: number;
  lives: number;
  // 地图
  paths: Position[][];
  mapWidth: number;
  mapHeight: number;
  roadWidthCells: number; // 路宽（用于放置限制 & 渲染）
  plantGrid: Position[]; // 可种植的格子点
  // 实体
  enemies: Enemy[];
  towers: Tower[];
  projectiles: Projectile[];
  singleUseCasts: ElementCast[];
  damagePopups: DamagePopup[];
  elementCooldowns: Partial<Record<ElementType, number>>;
  availablePlants: PlantType[];
  availableElements: ElementType[];
  // 波次
  waves: WaveDef[];
  waveIndex: number; // 当前波次（从0计）
  nextWaveStartTime?: number | null;
  isWaveActive: boolean;
  spawnCursor?: {
    groupIndex: number;
    nextSpawnTime: number; // 下一次刷新的绝对时间
    remaining: number; // 当前小组剩余
  } | null;
  // 玩家塔等级映射（用于放塔时按等级缩放面板）
  towerLevelMap?: Partial<Record<PlantType, number>>;
}
