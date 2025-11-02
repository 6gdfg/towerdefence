import { Unit, Card } from '../types/game';
import { MAP_CONFIG, getDistance } from '../config/mapConfig';
import {
  isStunned,
  cleanExpiredEffects,
  applyDotEffects,
  findNearestEnemy,
  moveTowardsTarget,
  calculateDamage,
  isInRange,
  getCatalystBonus,
  createFractionUnit,
  createTrojanWarrior,
  createFibonacciRabbit,
  fibonacci,
} from './gameLogic';

// 移动系统
export function updateUnitMovement(
  units: Unit[],
  cards: Map<string, Card>,
  deltaTime: number,
  gameTime: number
): Unit[] {
  return units.map(unit => {
    // 清理过期效果
    let updatedUnit = cleanExpiredEffects(unit, gameTime);
    
    // 检查是否被眩晕
    if (isStunned(updatedUnit, gameTime)) {
      return { ...updatedUnit, isMoving: false };
    }
    
    // 应用持续伤害
    updatedUnit = applyDotEffects(updatedUnit, gameTime, deltaTime);
    
    const card = cards.get(unit.cardId);
    if (!card) return updatedUnit;
    
    // 不移动的单位（建筑、催化剂等）
    if (card.cardType === 'building' || card.ability === 'catalyst' || card.moveSpeed === 0) {
      return { ...updatedUnit, isMoving: false };
    }
    
    // 寻找目标
    if (!updatedUnit.target) {
      const targetId = findNearestEnemy(updatedUnit, units, true);
      updatedUnit.target = targetId;
    }
    
    // 获取目标位置
    let targetPos = updatedUnit.side === 'player' 
      ? MAP_CONFIG.enemyTowerPosition 
      : MAP_CONFIG.playerTowerPosition;
    
    const targetUnit = units.find(u => u.id === updatedUnit.target);
    if (targetUnit) {
      targetPos = targetUnit.position;
    }
    
    // 检查是否在攻击范围内
    const range = card.range || 1;
    if (isInRange(updatedUnit, targetPos, range)) {
      return { ...updatedUnit, isMoving: false };
    }
    
    // 移动
    const newPosition = moveTowardsTarget(updatedUnit, targetPos, deltaTime, units);
    
    // 动能冲锋猪：加速
    if (updatedUnit.ability === 'kinetic' && updatedUnit.currentSpeed !== undefined) {
      const acceleration = 0.5; // 加速度
      const maxSpeed = 4; // 最大速度
      const newSpeed = Math.min(updatedUnit.currentSpeed + acceleration * deltaTime, maxSpeed);
      const distanceMoved = getDistance(
        newPosition.x,
        newPosition.y,
        updatedUnit.position.x,
        updatedUnit.position.y
      );
      
      return {
        ...updatedUnit,
        position: newPosition,
        currentSpeed: newSpeed,
        distanceTraveled: (updatedUnit.distanceTraveled || 0) + distanceMoved,
        isMoving: true,
      };
    }
    
    return {
      ...updatedUnit,
      position: newPosition,
      isMoving: true,
    };
  });
}

// 攻击系统
export function updateUnitAttacks(
  units: Unit[],
  cards: Map<string, Card>,
  gameTime: number,
  onDamage: (targetId: string, damage: number) => void
): Unit[] {
  return units.map(unit => {
    const card = cards.get(unit.cardId);
    if (!card || !card.damage || card.damage === 0) return unit;
    
    // 检查是否被眩晕
    if (isStunned(unit, gameTime)) return unit;
    
    // 检查攻击冷却
    const catalystBonus = getCatalystBonus(unit, units);
    const attackSpeed = (card.attackSpeed || 1) * catalystBonus;
    if (gameTime - unit.lastAttackTime < attackSpeed) return unit;
    
    // 寻找目标
    if (!unit.target) {
      const targetId = findNearestEnemy(unit, units, true);
      unit.target = targetId;
    }
    
    if (!unit.target) return unit;
    
    // 检查目标是否在范围内
    const range = card.range || 1;
    let targetPos;
    
    if (unit.target === 'player-tower') {
      targetPos = MAP_CONFIG.playerTowerPosition;
    } else if (unit.target === 'enemy-tower') {
      targetPos = MAP_CONFIG.enemyTowerPosition;
    } else {
      const targetUnit = units.find(u => u.id === unit.target);
      if (!targetUnit) {
        return { ...unit, target: null };
      }
      targetPos = targetUnit.position;
    }
    
    if (!isInRange(unit, targetPos, range)) {
      return unit;
    }
    
    // 执行攻击
    const damage = calculateDamage(unit, card);
    onDamage(unit.target, damage);
    
    // 动能冲锋猪：撞击后重置速度
    if (unit.ability === 'kinetic') {
      return {
        ...unit,
        lastAttackTime: gameTime,
        currentSpeed: card.moveSpeed || 1,
        distanceTraveled: 0,
      };
    }
    
    return {
      ...unit,
      lastAttackTime: gameTime,
    };
  });
}

// 特殊能力系统
export function updateAbilities(
  units: Unit[],
  cards: Map<string, Card>,
  gameTime: number
): { units: Unit[]; newUnits: Unit[] } {
  const newUnits: Unit[] = [];
  const unitsToRemove: string[] = [];
  
  const updatedUnits = units.map(unit => {
    const card = cards.get(unit.cardId);
    if (!card) return unit;
    
    // 斐波那契繁殖
    if (unit.ability === 'fibonacci' && unit.lastBreedTime !== undefined) {
      const breedInterval = card.abilityValue || 5;
      if (gameTime - unit.lastBreedTime >= breedInterval) {
        // 计算当前同侧斐波那契兔数量
        const rabbitCount = units.filter(
          u => u.cardId === 'fibonacci-rabbit' && u.side === unit.side
        ).length;
        
        // 根据斐波那契数列决定繁殖数量
        const shouldBreed = rabbitCount <= 8; // 最多8只
        if (shouldBreed && rabbitCount >= 2) {
          const breedCount = Math.min(fibonacci(rabbitCount) - rabbitCount, 3);
          for (let i = 0; i < breedCount; i++) {
            newUnits.push(createFibonacciRabbit(unit.position, unit.side, rabbitCount + 1));
          }
        }
        
        return { ...unit, lastBreedTime: gameTime };
      }
    }
    
    // 负数战士：血量达到0或以上时爆炸
    if (unit.isNegative && unit.hp >= 0) {
      // 范围爆炸
      const explosionRadius = 3;
      const explosionDamage = card.abilityValue || 200;
      
      units.forEach(target => {
        if (target.id !== unit.id) {
          const dist = getDistance(
            target.position.x,
            target.position.y,
            unit.position.x,
            unit.position.y
          );
          if (dist <= explosionRadius) {
            // 这里需要通过回调处理伤害
            target.hp -= explosionDamage;
          }
        }
      });
      
      unitsToRemove.push(unit.id);
      return unit;
    }
    
    return unit;
  });
  
  // 移除已死亡的单位
  const finalUnits = updatedUnits.filter(u => !unitsToRemove.includes(u.id));
  
  return { units: finalUnits, newUnits };
}

// 单位死亡处理
export function handleUnitDeath(
  unit: Unit,
  cards: Map<string, Card>
): Unit[] {
  const card = cards.get(unit.cardId);
  if (!card) return [];
  
  const newUnits: Unit[] = [];
  
  // 分数弓箭手：分裂
  if (unit.ability === 'fraction') {
    const generation = (unit.abilityData?.generation || 0) + 1;
    const maxGenerations = card.abilityValue || 2;
    
    if (generation <= maxGenerations) {
      // 生成两个小弓箭手
      for (let i = 0; i < 2; i++) {
        newUnits.push(createFractionUnit(unit, card, generation, unit.side));
      }
    }
  }
  
  // 特洛伊木马：释放战士
  if (unit.ability === 'trojan') {
    const warriorCount = card.abilityValue || 4;
    for (let i = 0; i < warriorCount; i++) {
      newUnits.push(createTrojanWarrior(unit.position, unit.side, i));
    }
  }
  
  return newUnits;
}

