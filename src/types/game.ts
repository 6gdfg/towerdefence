// 游戏核心类型定义

// 玩家方
export type PlayerSide = 'player' | 'enemy';

// 单位类型
export type UnitType = 'ground' | 'air' | 'building';

// 卡牌类型
export type CardType = 'unit' | 'spell' | 'building';

// 攻击目标类型
export type TargetType = 'ground' | 'air' | 'both';

// 位置
export interface Position {
  x: number;
  y: number;
}

// 特殊能力类型
export type AbilityType =
  | 'fibonacci' // 斐波那契繁殖
  | 'fraction' // 分数分裂
  | 'negative' // 负数逻辑
  | 'catalyst' // 催化剂光环
  | 'kinetic' // 动能加速
  | 'trojan' // 特洛伊木马
  | 'none';

// 状态效果
export interface StatusEffect {
  type: 'stun' | 'slow' | 'immune' | 'speedup' | 'dot'; // dot = damage over time
  duration: number; // 持续时间
  value?: number; // 效果值
  startTime: number; // 开始时间
}

// 卡牌定义
export interface Card {
  id: string;
  name: string;
  cost: number;
  emoji: string; // 用emoji作为图标
  description: string;
  cardType: CardType; // 卡牌类型
  unitType?: UnitType; // 单位类型（仅unit和building）
  // 单位属性
  hp?: number;
  damage?: number;
  attackSpeed?: number; // 攻击间隔(秒)
  moveSpeed?: number; // 移动速度(格/秒)
  range?: number; // 攻击范围(格)
  targetType?: TargetType;
  // 特殊能力
  ability?: AbilityType;
  abilityValue?: number; // 能力数值
  // 法术属性
  spellRadius?: number; // 法术范围
  spellDamage?: number; // 法术伤害
  spellDuration?: number; // 法术持续时间
}

// 场上单位
export interface Unit {
  id: string; // 唯一ID
  cardId: string; // 对应的卡牌ID
  side: PlayerSide;
  position: Position;
  hp: number;
  maxHp: number;
  target: string | null; // 目标单位ID
  lastAttackTime: number; // 上次攻击时间
  isMoving: boolean;
  // 特殊能力相关
  ability?: AbilityType;
  abilityData?: any; // 能力特定数据
  statusEffects: StatusEffect[]; // 状态效果列表
  // 动能冲锋猪专用
  currentSpeed?: number; // 当前速度
  distanceTraveled?: number; // 移动距离
  // 斐波那契兔专用
  generation?: number; // 第几代
  lastBreedTime?: number; // 上次繁殖时间
  // 负数战士专用
  isNegative?: boolean; // 是否为负数单位
}

// 游戏状态
export interface GameState {
  // 游戏阶段
  phase: 'deck-selection' | 'battle' | 'game-over';
  
  // 玩家数据
  playerElixir: number; // 当前费用
  playerMaxElixir: number; // 最大费用
  playerTowerHp: number; // 主塔血量
  playerDeck: Card[]; // 玩家卡组
  playerHand: Card[]; // 手牌
  
  // 敌人数据
  enemyElixir: number;
  enemyMaxElixir: number;
  enemyTowerHp: number;
  enemyDeck: Card[];
  enemyHand: Card[];
  
  // 场上单位
  units: Unit[];
  
  // 游戏时间
  gameTime: number;
  
  // 胜负
  winner: PlayerSide | null;
}

// 地图配置
export interface MapConfig {
  width: number; // 地图宽度(格)
  height: number; // 地图高度(格)
  riverY: number; // 河流Y坐标
  bridgePositions: Position[]; // 桥的位置
  playerTowerPosition: Position; // 玩家塔位置
  enemyTowerPosition: Position; // 敌人塔位置
}

