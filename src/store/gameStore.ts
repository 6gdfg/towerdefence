import { create } from 'zustand';
import { GameState, Card, Unit, PlayerSide, Position, StatusEffect } from '../types/game';
import { MAP_CONFIG, getDistance } from '../config/mapConfig';
import { updateUnitMovement, updateUnitAttacks, updateAbilities, handleUnitDeath } from '../utils/gameSystems';
import { SPECIAL_UNITS } from '../data/educationalCards';

interface GameStore extends GameState {
  // 动作
  startGame: (playerDeck: Card[], enemyDeck: Card[]) => void;
  playCard: (card: Card, position: Position, side: PlayerSide) => void;
  playSpell: (card: Card, position: Position, side: PlayerSide) => void;
  updateGame: (deltaTime: number) => void;
  resetGame: () => void;
  // 内部方法
  moveUnits: (deltaTime: number) => void;
  handleAttacks: (deltaTime: number) => void;
  handleAbilities: (deltaTime: number) => void;
  handleTowerAttacks: (deltaTime: number) => void;
  aiTurn: (deltaTime: number) => void;
}

const INITIAL_STATE: GameState = {
  phase: 'deck-selection',
  playerElixir: 5,
  playerMaxElixir: 10,
  playerTowerHp: 100,
  playerDeck: [],
  playerHand: [],
  enemyElixir: 5,
  enemyMaxElixir: 10,
  enemyTowerHp: 100,
  enemyDeck: [],
  enemyHand: [],
  units: [],
  gameTime: 0,
  winner: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,

  startGame: (playerDeck: Card[], enemyDeck: Card[]) => {
    set({
      ...INITIAL_STATE,
      phase: 'battle',
      playerDeck,
      enemyDeck,
      playerHand: playerDeck.slice(0, 4), // 初始4张手牌
      enemyHand: enemyDeck.slice(0, 4),
    });
  },

  playCard: (card: Card, position: Position, side: PlayerSide = 'player') => {
    const state = get();

    // 检查费用
    const currentElixir = side === 'player' ? state.playerElixir : state.enemyElixir;
    if (currentElixir < card.cost) return;

    // 法术卡特殊处理
    if (card.cardType === 'spell') {
      get().playSpell(card, position, side);
      return;
    }

    // 扣除费用
    if (side === 'player') {
      set({ playerElixir: state.playerElixir - card.cost });
    } else {
      set({ enemyElixir: state.enemyElixir - card.cost });
    }

    // 创建单位
    const newUnit: Unit = {
      id: `unit-${Date.now()}-${Math.random()}`,
      cardId: card.id,
      side,
      position,
      hp: card.hp || 0,
      maxHp: card.hp || 0,
      target: null,
      lastAttackTime: 0,
      isMoving: true,
      ability: card.ability,
      abilityData: {},
      statusEffects: [],
      // 特殊初始化
      currentSpeed: card.ability === 'kinetic' ? card.moveSpeed : undefined,
      distanceTraveled: card.ability === 'kinetic' ? 0 : undefined,
      generation: card.ability === 'fibonacci' ? 1 : undefined,
      lastBreedTime: card.ability === 'fibonacci' ? state.gameTime : undefined,
      isNegative: card.ability === 'negative',
    };

    set({ units: [...state.units, newUnit] });

    // 从手牌移除，补充新牌（循环使用卡组）
    if (side === 'player') {
      const cardIndex = state.playerHand.indexOf(card);
      if (cardIndex !== -1) {
        const newHand = [...state.playerHand];
        newHand.splice(cardIndex, 1); // 移除使用的卡牌

        // 计算已使用的卡牌数量
        const usedCards = state.playerDeck.length - newHand.length;
        // 循环获取下一张卡（使用模运算实现循环）
        const nextCardIndex = usedCards % state.playerDeck.length;
        newHand.push(state.playerDeck[nextCardIndex]);

        set({ playerHand: newHand });
      }
    } else {
      const cardIndex = state.enemyHand.indexOf(card);
      if (cardIndex !== -1) {
        const newHand = [...state.enemyHand];
        newHand.splice(cardIndex, 1);

        const usedCards = state.enemyDeck.length - newHand.length;
        const nextCardIndex = usedCards % state.enemyDeck.length;
        newHand.push(state.enemyDeck[nextCardIndex]);

        set({ enemyHand: newHand });
      }
    }
  },

  playSpell: (card: Card, position: Position, side: PlayerSide) => {
    const state = get();

    // 扣除费用
    if (side === 'player') {
      set({ playerElixir: state.playerElixir - card.cost });
    } else {
      set({ enemyElixir: state.enemyElixir - card.cost });
    }

    // 施放法术效果
    if (card.id === 'newton-apple') {
      // 牛顿的苹果：范围伤害+眩晕+击退
      const affectedUnits = state.units.filter(unit => {
        const dist = getDistance(unit.position.x, unit.position.y, position.x, position.y);
        return dist <= (card.spellRadius || 0) && unit.side !== side;
      });

      const updatedUnits = state.units.map(unit => {
        if (affectedUnits.includes(unit)) {
          // 造成伤害
          const newHp = unit.hp - (card.spellDamage || 0);
          // 添加眩晕效果
          const stunEffect: StatusEffect = {
            type: 'stun',
            duration: card.spellDuration || 0,
            startTime: state.gameTime,
          };
          // 击退
          const dx = unit.position.x - position.x;
          const dy = unit.position.y - position.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const knockbackX = Math.round(unit.position.x + (dx / dist) * 1);
          const knockbackY = Math.round(unit.position.y + (dy / dist) * 1);

          return {
            ...unit,
            hp: newHp,
            position: { x: knockbackX, y: knockbackY },
            statusEffects: [...unit.statusEffects, stunEffect],
          };
        }
        return unit;
      }).filter(unit => unit.hp > 0);

      set({ units: updatedUnits });
    } else if (card.id === 'acid-rain') {
      // 酸雨：持续伤害
      const affectedUnits = state.units.filter(unit => {
        const dist = getDistance(unit.position.x, unit.position.y, position.x, position.y);
        return dist <= (card.spellRadius || 0);
      });

      const updatedUnits = state.units.map(unit => {
        if (affectedUnits.includes(unit)) {
          const dotEffect: StatusEffect = {
            type: 'dot',
            duration: card.spellDuration || 0,
            value: card.spellDamage || 0,
            startTime: state.gameTime,
          };
          return {
            ...unit,
            statusEffects: [...unit.statusEffects, dotEffect],
          };
        }
        return unit;
      });

      set({ units: updatedUnits });
    } else if (card.id === 'inert-shield') {
      // 惰性气体护盾：免疫负面效果
      // 找到最近的友方单位
      const friendlyUnits = state.units.filter(u => u.side === side);
      if (friendlyUnits.length > 0) {
        const closest = friendlyUnits.reduce((prev, curr) => {
          const prevDist = getDistance(prev.position.x, prev.position.y, position.x, position.y);
          const currDist = getDistance(curr.position.x, curr.position.y, position.x, position.y);
          return currDist < prevDist ? curr : prev;
        });

        const updatedUnits = state.units.map(unit => {
          if (unit.id === closest.id) {
            const immuneEffect: StatusEffect = {
              type: 'immune',
              duration: card.spellDuration || 0,
              startTime: state.gameTime,
            };
            return {
              ...unit,
              statusEffects: [...unit.statusEffects, immuneEffect],
            };
          }
          return unit;
        });

        set({ units: updatedUnits });
      }
    }

    // 从手牌移除，补充新牌（循环使用卡组）
    if (side === 'player') {
      const cardIndex = state.playerHand.indexOf(card);
      if (cardIndex !== -1) {
        const newHand = [...state.playerHand];
        newHand.splice(cardIndex, 1);

        const usedCards = state.playerDeck.length - newHand.length;
        const nextCardIndex = usedCards % state.playerDeck.length;
        newHand.push(state.playerDeck[nextCardIndex]);

        set({ playerHand: newHand });
      }
    } else {
      const cardIndex = state.enemyHand.indexOf(card);
      if (cardIndex !== -1) {
        const newHand = [...state.enemyHand];
        newHand.splice(cardIndex, 1);

        const usedCards = state.enemyDeck.length - newHand.length;
        const nextCardIndex = usedCards % state.enemyDeck.length;
        newHand.push(state.enemyDeck[nextCardIndex]);

        set({ enemyHand: newHand });
      }
    }
  },

  updateGame: (deltaTime: number) => {
    const state = get();

    if (state.phase !== 'battle') return;

    // 更新游戏时间
    const newGameTime = state.gameTime + deltaTime;

    // 恢复费用 (每秒恢复1点)
    const playerElixir = Math.min(
      state.playerMaxElixir,
      state.playerElixir + deltaTime
    );
    const enemyElixir = Math.min(
      state.enemyMaxElixir,
      state.enemyElixir + deltaTime
    );

    set({ gameTime: newGameTime, playerElixir, enemyElixir });

    // 执行游戏逻辑
    get().moveUnits(deltaTime);
    get().handleAttacks(deltaTime);
    get().handleAbilities(deltaTime);
    get().handleTowerAttacks(deltaTime);
    get().aiTurn(deltaTime);

    // 检查胜负
    const currentState = get();
    let winner: PlayerSide | null = null;
    if (currentState.playerTowerHp <= 0) winner = 'enemy';
    if (currentState.enemyTowerHp <= 0) winner = 'player';

    if (winner) {
      set({ winner, phase: 'game-over' });
    }
  },

  moveUnits: (deltaTime: number) => {
    const state = get();
    const cardMap = new Map<string, Card>();

    // 构建卡牌映射（包含特殊单位）
    [...state.playerDeck, ...state.enemyDeck, ...SPECIAL_UNITS].forEach(card => {
      cardMap.set(card.id, card);
    });

    const updatedUnits = updateUnitMovement(state.units, cardMap, deltaTime, state.gameTime);
    set({ units: updatedUnits });
  },

  handleAttacks: (_deltaTime: number) => {
    const state = get();
    const cardMap = new Map<string, Card>();

    [...state.playerDeck, ...state.enemyDeck, ...SPECIAL_UNITS].forEach(card => {
      cardMap.set(card.id, card);
    });

    // 伤害回调
    const onDamage = (targetId: string, damage: number) => {
      const currentState = get();

      if (targetId === 'player-tower') {
        set({ playerTowerHp: Math.max(0, currentState.playerTowerHp - damage) });
      } else if (targetId === 'enemy-tower') {
        set({ enemyTowerHp: Math.max(0, currentState.enemyTowerHp - damage) });
      } else {
        const updatedUnits = currentState.units.map(u => {
          if (u.id === targetId) {
            // 负数战士特殊处理：受伤反而增加血量
            if (u.isNegative) {
              return { ...u, hp: u.hp + damage };
            }
            return { ...u, hp: u.hp - damage };
          }
          return u;
        });

        // 处理死亡单位
        const deadUnits = updatedUnits.filter(u => u.hp <= 0 && !u.isNegative);
        const aliveUnits = updatedUnits.filter(u => u.hp > 0 || u.isNegative);

        // 生成死亡单位的衍生物
        const newUnits: Unit[] = [];
        deadUnits.forEach(deadUnit => {
          const spawned = handleUnitDeath(deadUnit, cardMap);
          newUnits.push(...spawned);
        });

        set({ units: [...aliveUnits, ...newUnits] });
      }
    };

    const updatedUnits = updateUnitAttacks(state.units, cardMap, state.gameTime, onDamage);
    set({ units: updatedUnits });
  },

  handleAbilities: (_deltaTime: number) => {
    const state = get();
    const cardMap = new Map<string, Card>();

    [...state.playerDeck, ...state.enemyDeck, ...SPECIAL_UNITS].forEach(card => {
      cardMap.set(card.id, card);
    });

    const { units: updatedUnits, newUnits } = updateAbilities(state.units, cardMap, state.gameTime);
    set({ units: [...updatedUnits, ...newUnits] });
  },

  handleTowerAttacks: (deltaTime: number) => {
    const state = get();
    const towerRange = 7;
    const towerDamage = 50;
    const towerAttackSpeed = 1.0;

    // 玩家塔攻击
    const enemyUnitsInRange = state.units.filter(u => {
      if (u.side !== 'enemy') return false;
      const dist = getDistance(
        u.position.x,
        u.position.y,
        MAP_CONFIG.playerTowerPosition.x,
        MAP_CONFIG.playerTowerPosition.y
      );
      return dist <= towerRange;
    });

    if (enemyUnitsInRange.length > 0) {
      // 攻击最近的敌人
      const target = enemyUnitsInRange[0];
      const updatedUnits = state.units.map(u => {
        if (u.id === target.id) {
          return { ...u, hp: u.hp - towerDamage * deltaTime / towerAttackSpeed };
        }
        return u;
      }).filter(u => u.hp > 0);

      set({ units: updatedUnits });
    }

    // 敌人塔攻击
    const playerUnitsInRange = state.units.filter(u => {
      if (u.side !== 'player') return false;
      const dist = getDistance(
        u.position.x,
        u.position.y,
        MAP_CONFIG.enemyTowerPosition.x,
        MAP_CONFIG.enemyTowerPosition.y
      );
      return dist <= towerRange;
    });

    if (playerUnitsInRange.length > 0) {
      const target = playerUnitsInRange[0];
      const updatedUnits = state.units.map(u => {
        if (u.id === target.id) {
          return { ...u, hp: u.hp - towerDamage * deltaTime / towerAttackSpeed };
        }
        return u;
      }).filter(u => u.hp > 0);

      set({ units: updatedUnits });
    }
  },

  aiTurn: (_deltaTime: number) => {
    const state = get();

    // 简单AI：随机出牌
    if (state.enemyElixir >= 3 && state.enemyHand.length > 0 && Math.random() < 0.05) {
      // 选择一张能出的牌
      const affordableCards = state.enemyHand.filter(c => c.cost <= state.enemyElixir);
      if (affordableCards.length > 0) {
        const card = affordableCards[Math.floor(Math.random() * affordableCards.length)];

        // 随机位置（敌方半场）
        const x = Math.floor(Math.random() * MAP_CONFIG.width);
        const y = Math.floor(Math.random() * (MAP_CONFIG.riverY - 2)) + 2;

        get().playCard(card, { x, y }, 'enemy');
      }
    }
  },

  resetGame: () => {
    set(INITIAL_STATE);
  },
}));

