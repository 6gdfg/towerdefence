import { fetchCloudProgress, getToken } from './authProgress';
import type { CloudProgress } from './appTypes';
import { DEFAULT_UNLOCKED_ITEMS } from '../../shared/unlocks';
import { readApiJson } from './apiClient';
import type { DifficultyCode } from './levelRatings';

type CloudDataCache = {
  stars: Record<string, number>;
  fullHealthClears: Record<string, boolean>;
  unlocked: number;
  unlockedItems: string[];
};

export type SetStarResult = {
  ok: boolean;
  star: number;
  rewardCoins: number;
  chestId?: string | null;
  chestType?: string | null;
  chestTypes?: string[];
  chestAwarded?: boolean;
  chestInventoryFull?: boolean;
  repeatChestChance?: number;
  newRecord?: boolean;
  newUnlocks?: string[];
  fullHealthClear?: boolean;
  newFullHealthClear?: boolean;
  diamondReward?: number;
  atFirstClear?: boolean;
};

let cloudDataCache: CloudDataCache | null = null;
let cacheToken: string | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000;

function getActiveCache(): CloudDataCache | null {
  const token = getToken();
  return token && cacheToken === token ? cloudDataCache : null;
}

function toCloudDataCache(data: CloudProgress): CloudDataCache {
  return {
    stars: data.stars ?? {},
    fullHealthClears: data.fullHealthClears ?? {},
    unlocked: typeof data.unlocked === 'number' && data.unlocked >= 1 ? data.unlocked : 1,
    unlockedItems: Array.isArray(data.unlockedItems) && data.unlockedItems.length > 0 ? data.unlockedItems : [...DEFAULT_UNLOCKED_ITEMS],
  };
}

/** Sync the progress helpers with a successful /api/progress response. */
export function hydrateCloudProgressCache(data: CloudProgress): CloudDataCache | null {
  const token = getToken();
  if (!token) {
    cloudDataCache = null;
    cacheToken = null;
    cacheTimestamp = 0;
    return null;
  }

  const cache = toCloudDataCache(data);
  cloudDataCache = cache;
  cacheToken = token;
  cacheTimestamp = Date.now();
  return cache;
}

async function fetchCloudData() {
  const now = Date.now();
  const token = getToken();
  if (!token) {
    throw new Error('No token');
  }

  if (cloudDataCache && cacheToken === token && now - cacheTimestamp < CACHE_DURATION) {
    return cloudDataCache;
  }

  try {
    const d = await fetchCloudProgress();
    const cache = hydrateCloudProgressCache(d);
    if (!cache) throw new Error('Authentication expired');
    return cache;
  } catch (error) {
    // A failed request is not an empty account. Keep this user's last known
    // cloud state so a transient API failure cannot make progress disappear.
    if (cloudDataCache && cacheToken === token) {
      return cloudDataCache;
    }
    throw error;
  }
}

export function getUnlocked(): number {
  const cache = getActiveCache();
  return cache ? cache.unlocked : 1;
}

export function setUnlocked(n: number) {
  const cache = getActiveCache();
  if (cache) {
    cache.unlocked = Math.max(1, n);
  }
}

export function getUnlockedItems(): string[] {
  const cache = getActiveCache();
  return cache ? [...cache.unlockedItems] : [...DEFAULT_UNLOCKED_ITEMS];
}

export function updateUnlockedItems(newItems: string[]) {
  if (!newItems || newItems.length === 0) return;
  const token = getToken();
  if (!token) return;
  const cache = getActiveCache();
  if (!cache) {
    cloudDataCache = { stars: {}, fullHealthClears: {}, unlocked: 1, unlockedItems: [...DEFAULT_UNLOCKED_ITEMS, ...newItems] };
    cacheToken = token;
    cacheTimestamp = Date.now();
    return;
  }
  const set = new Set(cache.unlockedItems);
  newItems.forEach(item => set.add(item));
  cache.unlockedItems = Array.from(set);
}

export async function getMaxStar(levelId: string): Promise<0 | 1 | 2 | 3> {
  const data = await fetchCloudData();
  const v = data.stars[levelId] ?? 0;
  return (v === 1 || v === 2 || v === 3) ? v : 0;
}

export function getMaxStarSync(levelId: string): 0 | 1 | 2 | 3 {
  const cache = getActiveCache();
  if (!cache) return 0;
  const v = cache.stars[levelId] ?? 0;
  return (v === 1 || v === 2 || v === 3) ? v : 0;
}

export function getInFullHealthClearSync(levelId: string): boolean {
  const cache = getActiveCache();
  return Boolean(cache?.fullHealthClears[levelId]);
}

export async function setStarCleared(
  levelId: string,
  star: 1 | 2 | 3,
  opts?: { fullHealth?: boolean; difficulty?: DifficultyCode; challengeDiamonds?: number },
): Promise<SetStarResult | null> {
  try {
    const token = getToken();
    const resp = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        action: 'setStar',
        levelId,
        star,
        fullHealth: Boolean(opts?.fullHealth),
        difficulty: opts?.difficulty,
        challengeDiamonds: Math.max(0, Math.floor(Number(opts?.challengeDiamonds) || 0)),
      }),
    });
    if (resp.ok) {
      const data = await readApiJson<SetStarResult>(resp, 'Failed to save progress');

      const cache = getActiveCache();
      if (cache) {
        const currentStar = cache.stars[levelId] ?? 0;
        if (data.star > currentStar) {
          cache.stars[levelId] = data.star;
        }
        if (data.fullHealthClear) {
          cache.fullHealthClears[levelId] = true;
        }
      }
      if (Array.isArray(data.newUnlocks) && data.newUnlocks.length > 0) {
        updateUnlockedItems(data.newUnlocks);
      }

      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function getAllStars(): Record<string, number> {
  const cache = getActiveCache();
  return cache ? cache.stars : {};
}

export function clearCloudProgressCache(): void {
  cloudDataCache = null;
  cacheToken = null;
  cacheTimestamp = 0;
}

export async function refreshCache(): Promise<void> {
  cacheTimestamp = 0;
  await fetchCloudData();
}

export async function initCache(): Promise<void> {
  if (!cloudDataCache) {
    await fetchCloudData();
  }
}
