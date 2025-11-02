import { Unit, Card, Position, PlayerSide } from '../types/game';
import { getDistance, isWalkable, MAP_CONFIG } from '../config/mapConfig';

// 检查单位是否被眩晕
export function isStunned(unit: Unit, currentTime: number): boolean {
  return unit.statusEffects.some(
    effect => effect.type === 'stun' && currentTime - effect.startTime < effect.duration
  );
}

// 检查单位是否免疫
export function isImmune(unit: Unit, currentTime: number): boolean {
  return unit.statusEffects.some(
    effect => effect.type === 'immune' && currentTime - effect.startTime < effect.duration
  );
}

// 清理过期的状态效果
export function cleanExpiredEffects(unit: Unit, currentTime: number): Unit {
  return {
    ...unit,
    statusEffects: unit.statusEffects.filter(
      effect => currentTime - effect.startTime < effect.duration
    ),
  };
}

// 应用持续伤害效果
export function applyDotEffects(unit: Unit, currentTime: number, deltaTime: number): Unit {
  let totalDamage = 0;
  
  unit.statusEffects.forEach(effect => {
    if (effect.type === 'dot' && currentTime - effect.startTime < effect.duration) {
      totalDamage += (effect.value || 0) * deltaTime;
    }
  });
  
  return {
    ...unit,
    hp: unit.hp - totalDamage,
  };
}

// 寻找最近的敌人
export function findNearestEnemy(unit: Unit, allUnits: Unit[], includeTower: boolean = true): string | null {
  const enemies = allUnits.filter(u => u.side !== unit.side);
  
  if (enemies.length === 0) {
    // 如果没有敌方单位，攻击塔
    if (includeTower) {
      return unit.side === 'player' ? 'enemy-tower' : 'player-tower';
    }
    return null;
  }
  
  // 找到最近的敌人
  const nearest = enemies.reduce((prev, curr) => {
    const prevDist = getDistance(prev.position.x, prev.position.y, unit.position.x, unit.position.y);
    const currDist = getDistance(curr.position.x, curr.position.y, unit.position.x, unit.position.y);
    return currDist < prevDist ? curr : prev;
  });
  
  return nearest.id;
}

// 移动单位朝向目标
export function moveTowardsTarget(
  unit: Unit,
  targetPos: Position,
  deltaTime: number,
  allUnits: Unit[]
): Position {
  const dx = targetPos.x - unit.position.x;
  const dy = targetPos.y - unit.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 0.1) return unit.position;

  // 获取卡牌数据以获取移动速度
  let moveSpeed = 2; // 默认速度

  // 动能冲锋猪特殊处理
  if (unit.ability === 'kinetic' && unit.currentSpeed !== undefined) {
    moveSpeed = unit.currentSpeed;
  }

  const moveDistance = moveSpeed * deltaTime;
  const ratio = Math.min(moveDistance / distance, 1);

  let newX = unit.position.x + dx * ratio;
  let newY = unit.position.y + dy * ratio;

  // 检查新位置是否可通行（河流和边界检测）
  if (!isWalkable(Math.round(newX), Math.round(newY))) {
    // 如果不能直接到达，尝试寻找最近的桥
    const currentY = Math.round(unit.position.y);
    const riverY = MAP_CONFIG.riverY;

    // 如果单位在河流附近，引导它走向最近的桥
    if (Math.abs(currentY - riverY) <= 2) {
      const bridges = MAP_CONFIG.bridgePositions;
      const nearestBridge = bridges.reduce((prev, curr) => {
        const prevDist = getDistance(unit.position.x, unit.position.y, prev.x, prev.y);
        const currDist = getDistance(unit.position.x, unit.position.y, curr.x, curr.y);
        return currDist < prevDist ? curr : prev;
      });

      // 朝向最近的桥移动
      const bridgeDx = nearestBridge.x - unit.position.x;
      const bridgeDy = nearestBridge.y - unit.position.y;
      const bridgeDistance = Math.sqrt(bridgeDx * bridgeDx + bridgeDy * bridgeDy);

      if (bridgeDistance > 0.1) {
        const bridgeRatio = Math.min(moveDistance / bridgeDistance, 1);
        newX = unit.position.x + bridgeDx * bridgeRatio;
        newY = unit.position.y + bridgeDy * bridgeRatio;

        // 再次检查新位置
        if (!isWalkable(Math.round(newX), Math.round(newY))) {
          return unit.position; // 还是不能走，保持原位
        }
      }
    } else {
      return unit.position; // 不能移动到目标位置
    }
  }

  // 简单碰撞检测：检查新位置是否与其他单位重叠
  const hasCollision = allUnits.some(other => {
    if (other.id === unit.id) return false;
    const dist = getDistance(newX, newY, other.position.x, other.position.y);
    return dist < 0.8; // 碰撞阈值
  });

  if (hasCollision) {
    return unit.position; // 不移动
  }

  // 确保新位置在地图边界内
  newX = Math.max(0, Math.min(MAP_CONFIG.width - 1, newX));
  newY = Math.max(0, Math.min(MAP_CONFIG.height - 1, newY));

  return { x: newX, y: newY };
}

// 计算攻击伤害
export function calculateDamage(attacker: Unit, card: Card): number {
  let baseDamage = card.damage || 0;
  
  // 动能冲锋猪：伤害 = 0.5 * 质量 * 速度²
  if (attacker.ability === 'kinetic' && attacker.currentSpeed !== undefined) {
    const mass = card.damage || 20;
    const speed = attacker.currentSpeed;
    baseDamage = 0.5 * mass * (speed * speed);
  }
  
  // 负数战士：正常攻击
  if (attacker.isNegative) {
    baseDamage = Math.abs(card.damage || 0);
  }
  
  return baseDamage;
}

// 检查是否在攻击范围内
export function isInRange(attacker: Unit, target: Unit | Position, range: number): boolean {
  const targetPos = 'position' in target ? target.position : target;
  const dist = getDistance(attacker.position.x, attacker.position.y, targetPos.x, targetPos.y);
  return dist <= range;
}

// 获取催化剂光环加成
export function getCatalystBonus(unit: Unit, allUnits: Unit[]): number {
  if (unit.side === 'enemy') return 1; // 敌人不受催化剂影响（简化）
  
  // 查找周围的催化剂
  const catalysts = allUnits.filter(u => 
    u.side === unit.side && 
    u.ability === 'catalyst' &&
    getDistance(u.position.x, u.position.y, unit.position.x, unit.position.y) <= 4
  );
  
  if (catalysts.length > 0) {
    return 0.5; // 攻击速度提升50%（攻击间隔减少50%）
  }
  
  return 1;
}

// 创建分裂单位（分数弓箭手）
export function createFractionUnit(
  originalUnit: Unit,
  card: Card,
  generation: number,
  side: PlayerSide
): Unit {
  const fraction = Math.pow(0.5, generation); // 1/2, 1/4, 1/8...
  
  return {
    id: `unit-${Date.now()}-${Math.random()}`,
    cardId: card.id,
    side,
    position: {
      x: originalUnit.position.x + (Math.random() - 0.5) * 2,
      y: originalUnit.position.y + (Math.random() - 0.5) * 2,
    },
    hp: (card.hp || 0) * fraction,
    maxHp: (card.hp || 0) * fraction,
    target: null,
    lastAttackTime: 0,
    isMoving: true,
    ability: 'fraction',
    abilityData: { generation },
    statusEffects: [],
  };
}

// 创建特洛伊战士
export function createTrojanWarrior(position: Position, side: PlayerSide, index: number): Unit {
  const angle = (index / 4) * Math.PI * 2;
  const offset = 1.5;

  return {
    id: `warrior-${Date.now()}-${Math.random()}-${index}`,
    cardId: 'greek-warrior', // 使用特殊ID
    side,
    position: {
      x: Math.max(0, Math.min(17, position.x + Math.cos(angle) * offset)),
      y: Math.max(0, Math.min(31, position.y + Math.sin(angle) * offset)),
    },
    hp: 150,
    maxHp: 150,
    target: null,
    lastAttackTime: 0,
    isMoving: true,
    ability: 'none',
    abilityData: {},
    statusEffects: [],
  };
}

// 创建斐波那契兔子
export function createFibonacciRabbit(position: Position, side: PlayerSide, generation: number): Unit {
  return {
    id: `rabbit-${Date.now()}-${Math.random()}`,
    cardId: 'fibonacci-rabbit',
    side,
    position: {
      x: position.x + (Math.random() - 0.5) * 2,
      y: position.y + (Math.random() - 0.5) * 2,
    },
    hp: 80,
    maxHp: 80,
    target: null,
    lastAttackTime: 0,
    isMoving: true,
    ability: 'fibonacci',
    abilityData: {},
    statusEffects: [],
    generation,
    lastBreedTime: Date.now() / 1000,
  };
}

// 斐波那契数列
export function fibonacci(n: number): number {
  if (n <= 1) return 1;
  if (n === 2) return 1;
  let a = 1, b = 1;
  for (let i = 3; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}

