import { Card } from '../types/game';

// 8张学科卡牌
export const EDUCATIONAL_CARDS: Card[] = [
  // 1. 斐波那契兔
  {
    id: 'fibonacci-rabbit',
    name: '斐波那契兔',
    cost: 3,
    emoji: '🐰',
    description: '每5秒繁殖，数量按斐波那契数列增长',
    cardType: 'unit',
    unitType: 'ground',
    hp: 80,
    damage: 15,
    attackSpeed: 1.5,
    moveSpeed: 2,
    range: 1,
    targetType: 'ground',
    ability: 'fibonacci',
    abilityValue: 5, // 繁殖间隔(秒)
  },

  // 2. 分数弓箭手
  {
    id: 'fraction-archer',
    name: '分数弓箭手',
    cost: 4,
    emoji: '🏹',
    description: '死亡时分裂成两个1/2弓箭手',
    cardType: 'unit',
    unitType: 'ground',
    hp: 120,
    damage: 40,
    attackSpeed: 1.2,
    moveSpeed: 2,
    range: 6,
    targetType: 'both',
    ability: 'fraction',
    abilityValue: 2, // 最多分裂次数
  },

  // 3. 负数战士
  {
    id: 'negative-knight',
    name: '负数战士',
    cost: 2,
    emoji: '➖',
    description: '血量为负数，受伤反而增加，达到0时爆炸',
    cardType: 'unit',
    unitType: 'ground',
    hp: -100, // 负数血量
    damage: 25,
    attackSpeed: 1.5,
    moveSpeed: 2,
    range: 1,
    targetType: 'ground',
    ability: 'negative',
    abilityValue: 200, // 爆炸伤害
  },

  // 4. 催化剂
  {
    id: 'catalyst',
    name: '催化剂',
    cost: 2,
    emoji: '⚗️',
    description: '提升周围友军50%攻击速度',
    cardType: 'unit',
    unitType: 'ground',
    hp: 100,
    damage: 0, // 不攻击
    attackSpeed: 0,
    moveSpeed: 2,
    range: 0,
    targetType: 'ground',
    ability: 'catalyst',
    abilityValue: 4, // 光环范围
  },

  // 5. 动能冲锋猪
  {
    id: 'kinetic-hog',
    name: '动能冲锋猪',
    cost: 4,
    emoji: '🐗',
    description: '速度越快伤害越高，伤害=0.5×20×速度²',
    cardType: 'unit',
    unitType: 'ground',
    hp: 200,
    damage: 20, // 基础质量
    attackSpeed: 1.0,
    moveSpeed: 1, // 起始速度
    range: 1,
    targetType: 'ground',
    ability: 'kinetic',
    abilityValue: 0.5, // 加速度(格/秒²)
  },

  // 6. 特洛伊木马
  {
    id: 'trojan-horse',
    name: '特洛伊木马',
    cost: 6,
    emoji: '🐴',
    description: '被摧毁时释放4个希腊战士',
    cardType: 'unit',
    unitType: 'ground',
    hp: 800,
    damage: 0, // 不攻击
    attackSpeed: 0,
    moveSpeed: 0.5, // 极慢
    range: 0,
    targetType: 'ground',
    ability: 'trojan',
    abilityValue: 4, // 释放战士数量
  },

  // 7. 牛顿的苹果（法术）
  {
    id: 'newton-apple',
    name: '牛顿的苹果',
    cost: 3,
    emoji: '🍎',
    description: '范围伤害+眩晕+击退',
    cardType: 'spell',
    spellRadius: 3,
    spellDamage: 80,
    spellDuration: 2, // 眩晕时间
  },

  // 8. 酸雨（法术）
  {
    id: 'acid-rain',
    name: '酸雨',
    cost: 4,
    emoji: '☔',
    description: '持续8秒，每秒15点腐蚀伤害',
    cardType: 'spell',
    spellRadius: 5,
    spellDamage: 15, // 每秒伤害
    spellDuration: 8, // 持续时间
  },

  // 9. 惰性气体护盾（法术）
  {
    id: 'inert-shield',
    name: '惰性气体护盾',
    cost: 3,
    emoji: '🛡️',
    description: '5秒内免疫所有负面效果',
    cardType: 'spell',
    spellRadius: 0, // 单体目标
    spellDamage: 0,
    spellDuration: 5, // 护盾持续时间
  },
];

// 特殊单位（不在选卡池中，由其他卡牌生成）
export const SPECIAL_UNITS: Card[] = [
  // 希腊战士（特洛伊木马释放）
  {
    id: 'greek-warrior',
    name: '希腊战士',
    cost: 0,
    emoji: '⚔️',
    description: '特洛伊木马释放的战士',
    cardType: 'unit',
    unitType: 'ground',
    hp: 150,
    damage: 50,
    attackSpeed: 1.0,
    moveSpeed: 3,
    range: 1,
    targetType: 'ground',
    ability: 'none',
  },
];

