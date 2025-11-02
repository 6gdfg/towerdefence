import { fetchCloudProgress, getToken, getPlayerId } from './authProgress';

export const DEFAULT_UNLOCKED_ITEMS = ['sunflower', 'bottleGrass'];

// 添加缓存变量（内存中，不使用localStorage）
let cloudDataCache: { stars: Record<string, number>; unlocked: number; unlockedItems: string[] } | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5秒缓存

async function fetchCloudData() {
  const now = Date.now();
  if (cloudDataCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return cloudDataCache;
  }

  try {
    const d = await fetchCloudProgress();
    cloudDataCache = {
      stars: d.stars ?? {},
      unlocked: typeof d.unlocked === 'number' && d.unlocked >= 1 ? d.unlocked : 1,
      unlockedItems: Array.isArray(d.unlockedItems) && d.unlockedItems.length > 0 ? d.unlockedItems : [...DEFAULT_UNLOCKED_ITEMS],
    };
    cacheTimestamp = now;
    return cloudDataCache;
  } catch {
    return { stars: {}, unlocked: 1, unlockedItems: [...DEFAULT_UNLOCKED_ITEMS] };
  }
}

export function getUnlocked(): number {
  const cache = cloudDataCache;
  return cache ? cache.unlocked : 1;
}

export function setUnlocked(n: number) {
  if (cloudDataCache) {
    cloudDataCache.unlocked = Math.max(1, n);
  }
}

export function getUnlockedItems(): string[] {
  const cache = cloudDataCache;
  return cache ? [...cache.unlockedItems] : [...DEFAULT_UNLOCKED_ITEMS];
}

export function updateUnlockedItems(newItems: string[]) {
  if (!newItems || newItems.length === 0) return;
  if (!cloudDataCache) {
    cloudDataCache = { stars: {}, unlocked: 1, unlockedItems: [...DEFAULT_UNLOCKED_ITEMS, ...newItems] };
    return;
  }
  const set = new Set(cloudDataCache.unlockedItems);
  newItems.forEach(item => set.add(item));
  cloudDataCache.unlockedItems = Array.from(set);
}

export async function getMaxStar(levelId: string): Promise<0|1|2|3> {
  const data = await fetchCloudData();
  const v = data.stars[levelId] ?? 0;
  return (v === 1 || v === 2 || v === 3) ? v : 0;
}

// 同步版本（用于UI渲染）
export function getMaxStarSync(levelId: string): 0|1|2|3 {
  const cache = cloudDataCache;
  if (!cache) return 0;
  const v = cache.stars[levelId] ?? 0;
  return (v === 1 || v === 2 || v === 3) ? v : 0;
}

export async function setStarCleared(levelId: string, star: 1|2|3): Promise<{ok: boolean; star: number; rewardCoins: number; chestId?: string; chestType?: string; newRecord?: boolean; newUnlocks?: string[]} | null> {
  try {
    const playerId = getPlayerId();
    const token = getToken();
    const resp = await fetch('/api/progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ action: 'setStar', playerId, levelId, star })
    });
    if (resp.ok) {
      const data = await resp.json();

      // 更新内存缓存
      if (cloudDataCache) {
        const currentStar = cloudDataCache.stars[levelId] ?? 0;
        if (data.star > currentStar) {
          cloudDataCache.stars[levelId] = data.star;
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
  const cache = cloudDataCache;
  return cache ? cache.stars : {};
}

// 刷新缓存（强制从云端重新加载）
export async function refreshCache(): Promise<void> {
  cloudDataCache = null;
  cacheTimestamp = 0;
  await fetchCloudData();
}

// 初始加载缓存
export async function initCache(): Promise<void> {
  if (!cloudDataCache) {
    await fetchCloudData();
  }
}
