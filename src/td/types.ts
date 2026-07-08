import { Position } from '../types/game';

export type ShapeType = 'circle' | 'triangle' | 'square' | 'healer' | 'evilSniper' | 'rager' | 'summoner' | 'igniter' | 'armored' | 'iceShell' | 'purifier' | 'angryWriter';

export interface Enemy {
  id: string;
  pos: Position;
  hp: number;
  maxHp: number;
  armorHp?: number;
  maxArmorHp?: number;
  speed: number; // 格/秒
  shape: ShapeType;
  leakDamage: number; // 泄漏时对玩家造成的伤害（生命扣减）
  level?: number; // 怪物等级（显示用，可选，默认1）
  isBoss?: boolean; // Boss 只影响显示体型等表现，不参与基础数值公式
  // 路径进度
  pathIndex: number; // 当前处于 path[pathIndex] -> path[pathIndex+1] 之间
  t: number; // [0,1)
  progress: number; // 全局进度，用于选取“最前进”目标
  pathId: number; // 该敌人所走的路径ID
  slowPct?: number;
  slowUntil?: number; // gameTime
  freezeUntil?: number; // gameTime
  armorBreakUntil?: number;
  armorBreakDamageMultiplier?: number;
  burnDamagePerSec?: number;
  burnUntil?: number;
  burnAccumulator?: number;
  knockbackX?: number;
  knockbackY?: number;
  knockbackUntil?: number;
  rewardGiven?: boolean;
  deathEffectTriggered?: boolean;
  specialTimer?: number;
  speedBoostMultiplier?: number;
  speedBoostUntil?: number;
  newspaperStunUntil?: number;
  newspaperEnraged?: boolean;
}

export type PlantType = 'sunflower' | 'bottleGrass' | 'doubleBottleGrass' | 'puffShroom' | 'fourLeafClover' | 'machineGun' | 'sniper' | 'rocket' | 'sunlightFlower' | 'hotPepper' | 'cycloneShroom' | 'magnetNeedle' | 'frostBlastShroom' | 'electricFlower' | 'holyFlower';
export type ElementType = 'gold' | 'fire' | 'electric' | 'ice' | 'wind' | 'light';
export type TowerLevelKey = PlantType | `element:${ElementType}`;
export type TowerLevelMap = Partial<Record<TowerLevelKey, number>>;

export type AtModeType = 'normal' | 'conveyor' | 'lastStand' | 'cardSelect';
export type ConveyorItem =
  | { kind: 'plant'; id: PlantType; weight?: number }
  | { kind: 'element'; id: ElementType; weight?: number };

export type AtModeConfig = {
  type: AtModeType;
  conveyor?: {
    intervalSec: number;
    maxQueue: number;
    pool: ConveyorItem[];
  };
  lastStand?: {
    startGold: number;
    bannedPlants?: PlantType[];
    disableKillRewards?: boolean;
  };
  cardSelect?: {
    maxPlants: number;
    maxElements: number;
    monsterLevelMultiplier: number;
  };
};

export type LabPlantStatOverride = Partial<Record<'cost' | 'range' | 'damage' | 'fireRate' | 'projectileSpeed' | 'placementCooldown' | 'incomeInterval' | 'incomeBase' | 'incomeBonusPerLevel', number>>;
export type LabMonsterStatOverride = Partial<Record<'hp' | 'armorHp' | 'speed' | 'leakDamage', number>>;
export type LabOverrides = {
  plants?: Partial<Record<PlantType, LabPlantStatOverride>>;
  monsters?: Partial<Record<ShapeType, LabMonsterStatOverride>>;
};

export type TowerType = PlantType;
export type GameMode = 'campaign' | 'at' | 'endless' | 'endlessTest' | 'random' | 'lab';

export interface Tower {
  id: string;
  pos: Position;
  type: PlantType;
  level?: number; // 塔等级（默认1）
  range: number; // 格
  damage: number;
  fireRate: number; // 次/秒
  lastShotTime: number;
  lockedTargetId?: string;
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
  controlAuraLastPulseTime?: number;
  channelDamagePct?: number;
  channelNextTickTime?: number;
  expiresAt?: number;
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
  elementType?: ElementType;
  breakArmorDuration?: number;
  breakArmorDamageMultiplier?: number;
  burnDamagePerSec?: number;
  burnDuration?: number;
  splashPercent?: number;
  knockbackDistance?: number;
  pierceLimit?: number;
  pierceHitCount?: number;
  damageDecayFactor?: number;
  bounceCount?: number;
  maxBounces?: number;
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

export interface SunPickup {
  id: string;
  pos: Position;
  value: number;
  source: 'plant' | 'sky';
  createdAt: number;
  expiresAt: number;
  falling?: boolean;
  landedAt?: number;
  collecting?: boolean;
  collectedAt?: number;
  collectFrom?: Position;
}

export interface WaveGroup {
  type: ShapeType;
  count: number;
  interval: number; // 秒
  level: number; // 怪物等级（决定HP和速度）
  reward?: number; // 兼容旧草稿；运行时击杀奖励按怪物类型/Boss写死
  isBoss?: boolean; // 是否按 Boss 体型渲染，可与多数量/自动分流共存
  startDelay?: number; // 从本波开始后延迟几秒开始刷；同一延迟可同时刷多个怪组
  pathId?: number; // 指定走哪条路径（多路径地图）
  leakDamage?: number; // 泄漏伤害（默认1）
}

export interface WaveDef {
  groups: WaveGroup[];
}

export interface SpawnCursor {
  groupIndex: number;
  nextSpawnTime: number; // 下一次刷新的绝对时间
  remaining: number; // 当前小组剩余
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
  sunPickups: SunPickup[];
  elementCooldowns: Partial<Record<ElementType, number>>;
  plantCooldowns: Partial<Record<PlantType, number>>;
  availablePlants: PlantType[];
  availableElements: ElementType[];
  atModeConfig?: AtModeConfig | null;
  conveyorQueue: ConveyorItem[];
  nextConveyorItemAt?: number | null;
  nextSkySunAt?: number | null;
  autoCollectSun?: boolean;
  disableKillRewards?: boolean;
  // 波次
  waves: WaveDef[];
  waveIndex: number; // 当前波次（从0计）
  nextWaveStartTime?: number | null;
  isWaveActive: boolean;
  spawnCursor?: SpawnCursor[] | null;
  // 玩家塔等级映射（用于放塔时按等级缩放面板）
  towerLevelMap?: TowerLevelMap;
  labOverrides?: LabOverrides | null;
  mode?: GameMode;
  lifeBonusPerWave?: number;
  wavesCleared?: number;
  endlessWaveFactory?: ((waveNumber: number) => WaveDef) | null;
}
