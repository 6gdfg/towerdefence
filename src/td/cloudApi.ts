import { getToken } from './authProgress';

export type ChestOpenResult = {
  shards: Record<string, number>;
  plantShards: Record<string, number>;
  elementShards: Record<string, number>;
  coins: number;
  chestType: string;
  magicKeys?: number;
};

async function postCloudAction<T>(url: string, body: Record<string, unknown>): Promise<T | null> {
  const token = getToken();
  if (!token) return null;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }
  return data as T;
}

export function startChestUnlock(chestId: string) {
  return postCloudAction<{ ok: boolean; readyAt?: string }>('/api/chest', { action: 'startUnlock', chestId });
}

export function openChestReward(chestId: string) {
  return postCloudAction<ChestOpenResult>('/api/chest', { action: 'open', chestId });
}

export function skipChestUnlock(chestId: string) {
  return postCloudAction<{ ok: boolean; cost?: number; readyAt?: string }>('/api/chest', { action: 'skip', chestId });
}

export function upgradeCloudTower(towerType: string) {
  return postCloudAction<{ ok: boolean; towerType: string; level: number }>('/api/upgrade', { action: 'upgrade', towerType });
}

export function unlockLevelWithKey(levelId: string) {
  return postCloudAction<{ ok: boolean; remainingKeys: number }>('/api/progress', { action: 'unlockWithKey', levelId });
}
