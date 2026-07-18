import { getToken } from '../td/authProgress';
import { readApiJson } from '../td/apiClient';

export type GardenSeedType = 'plant' | 'chest';

export type GardenPlot = {
  index: number;
  seedType: GardenSeedType;
  targetItem: string | null;
  plantedAt: string;
  readyAt: string;
};

export type GardenHarvest = {
  seedType: GardenSeedType;
  targetItem?: string;
  shards?: number;
  recycledSeed?: number;
  chestType?: string;
  chestId?: string;
};

export type GardenPayload = {
  plantSeeds: number;
  chestSeeds: number;
  unlockedPlots: number;
  unlockCost: number;
  chestCount: number;
  maxChests: number;
  efficiencyLevel: number;
  luckLevel: number;
  maxEfficiencyLevel: number;
  maxLuckLevel: number;
  efficiencyReductionPct: number;
  shardChances: { one: number; two: number; three: number };
  seedRecyclePct: number;
  growthSeconds: Record<GardenSeedType, number>;
  plots: GardenPlot[];
  wallet: { coins: number; diamonds: number; experience: number };
  harvest?: GardenHarvest;
};

const DEV_GARDEN_KEY = 'td-garden-dev-preview-v1';
const DEV_PLANTS = ['sunflower', 'bottleGrass', 'doubleBottleGrass', 'flameBottleGrass', 'puffShroom', 'fourLeafClover', 'pentagram', 'machineGun', 'sniper', 'rocket', 'sunlightFlower', 'holyFlower', 'hotPepper', 'frostBlastShroom', 'cycloneShroom', 'magnetNeedle', 'electricFlower'];

export function isGardenDevPreview() {
  return import.meta.env.DEV && !getToken();
}

function createDevGarden(): GardenPayload {
  return {
    plantSeeds: 12,
    chestSeeds: 8,
    unlockedPlots: 8,
    unlockCost: 2000,
    chestCount: 0,
    maxChests: 20,
    efficiencyLevel: 1,
    luckLevel: 1,
    maxEfficiencyLevel: 80,
    maxLuckLevel: 50,
    efficiencyReductionPct: 0,
    shardChances: { one: 100, two: 0, three: 0 },
    seedRecyclePct: 50,
    growthSeconds: { plant: 20, chest: 40 },
    plots: [],
    wallet: { coins: 20_000, diamonds: 5, experience: 1000 },
  };
}

function readDevGarden() {
  try {
    const raw = window.localStorage.getItem(DEV_GARDEN_KEY);
    if (!raw) return createDevGarden();
    const parsed = JSON.parse(raw) as GardenPayload;
    const merged = { ...createDevGarden(), ...parsed, harvest: undefined };
    if (typeof parsed.efficiencyLevel !== 'number') {
      merged.wallet = { ...merged.wallet, experience: 1000 };
    }
    return merged;
  } catch {
    return createDevGarden();
  }
}

function saveDevGarden(garden: GardenPayload) {
  const { harvest: _harvest, ...stored } = garden;
  window.localStorage.setItem(DEV_GARDEN_KEY, JSON.stringify(stored));
}

function randomDevChestType() {
  const roll = Math.random();
  if (roll < 0.8) return 'common';
  if (roll < 0.95) return 'rare';
  if (roll < 0.99) return 'epic';
  return 'legendary';
}

function devGardenRequest(body?: Record<string, unknown>): GardenPayload {
  const garden = readDevGarden();
  if (!body) return garden;
  const action = body.action;

  if (action === 'unlockPlot') {
    if (garden.wallet.coins < garden.unlockCost) throw new Error('金币不足');
    garden.wallet.coins -= garden.unlockCost;
    garden.unlockedPlots += 1;
  } else if (action === 'upgrade') {
    const upgradeType = body.upgradeType;
    if (upgradeType !== 'efficiency' && upgradeType !== 'luck') throw new Error('升级类型无效');
    const levelKey = upgradeType === 'efficiency' ? 'efficiencyLevel' : 'luckLevel';
    const maxLevel = upgradeType === 'efficiency' ? garden.maxEfficiencyLevel : garden.maxLuckLevel;
    const currentLevel = garden[levelKey];
    if (currentLevel >= maxLevel) throw new Error('已达到最高等级');
    const cost = 3 + currentLevel;
    if (garden.wallet.experience < cost) throw new Error('经验不足');
    garden.wallet.experience -= cost;
    garden[levelKey] += 1;
    garden.efficiencyReductionPct = garden.efficiencyLevel - 1;
    const luckSteps = Math.min(11, garden.luckLevel) - 1;
    garden.shardChances = { one: 100 - 10 * luckSteps, two: 7 * luckSteps, three: 3 * luckSteps };
    garden.seedRecyclePct = 49 + garden.luckLevel;
  } else if (action === 'plant') {
    const plotIndex = Math.floor(Number(body.plotIndex));
    const seedType = body.seedType as GardenSeedType;
    if (!Number.isFinite(plotIndex) || plotIndex < 0 || plotIndex >= garden.unlockedPlots) throw new Error('田地不可用');
    if (garden.plots.some(plot => plot.index === plotIndex)) throw new Error('田地已有作物');
    if (seedType !== 'plant' && seedType !== 'chest') throw new Error('种子类型无效');
    const seedKey = seedType === 'plant' ? 'plantSeeds' : 'chestSeeds';
    if (garden[seedKey] < 1) throw new Error('种子不足');
    garden[seedKey] -= 1;
    const now = Date.now();
    garden.plots.push({
      index: plotIndex,
      seedType,
      targetItem: seedType === 'plant' ? DEV_PLANTS[Math.floor(Math.random() * DEV_PLANTS.length)] : null,
      plantedAt: new Date(now).toISOString(),
      readyAt: new Date(now + garden.growthSeconds[seedType] * (1 - garden.efficiencyReductionPct / 100) * 1000).toISOString(),
    });
  } else if (action === 'harvest') {
    const plotIndex = Math.floor(Number(body.plotIndex));
    const plot = garden.plots.find(item => item.index === plotIndex);
    if (!plot || new Date(plot.readyAt).getTime() > Date.now()) throw new Error('尚未成熟');
    garden.plots = garden.plots.filter(item => item.index !== plotIndex);
    if (plot.seedType === 'plant') {
      const roll = Math.random() * 100;
      const shards = roll < garden.shardChances.three
        ? 3
        : roll < garden.shardChances.three + garden.shardChances.two ? 2 : 1;
      const recycledSeed = Math.random() < garden.seedRecyclePct / 100 ? 1 : 0;
      garden.plantSeeds += recycledSeed;
      garden.harvest = { seedType: 'plant', targetItem: plot.targetItem ?? 'sunflower', shards, recycledSeed };
    } else {
      if (garden.chestCount >= garden.maxChests) throw new Error('宝箱库存已满');
      garden.chestCount += 1;
      garden.harvest = { seedType: 'chest', chestType: randomDevChestType(), chestId: `dev-${Date.now()}` };
    }
  } else {
    throw new Error('未知花园操作');
  }

  saveDevGarden(garden);
  return garden;
}

async function gardenRequest(body?: Record<string, unknown>) {
  if (isGardenDevPreview()) return devGardenRequest(body);
  const token = getToken();
  if (!token) throw new Error('请先登录账号');
  const response = await fetch('/api/garden', body ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  } : { headers: { Authorization: `Bearer ${token}` } });
  return readApiJson<GardenPayload>(response, '花园操作失败');
}

export function fetchGarden() {
  return gardenRequest();
}

export function plantGardenSeed(plotIndex: number, seedType: GardenSeedType) {
  return gardenRequest({ action: 'plant', plotIndex, seedType });
}

export function harvestGardenPlot(plotIndex: number) {
  return gardenRequest({ action: 'harvest', plotIndex });
}

export function unlockGardenPlot() {
  return gardenRequest({ action: 'unlockPlot' });
}

export function upgradeGarden(upgradeType: 'efficiency' | 'luck') {
  return gardenRequest({ action: 'upgrade', upgradeType });
}
