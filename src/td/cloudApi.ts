import { getToken, getUsername } from './authProgress';
import { readApiJson } from './apiClient';

export type ChestOpenResult = {
  shards: Record<string, number>;
  plantShards: Record<string, number>;
  elementShards: Record<string, number>;
  coins: number;
  chestType: string;
  chestTypes?: Record<string, number>;
  openedCount?: number;
  magicKeys?: number;
  plantSeeds?: number;
  chestSeeds?: number;
  newUnlocks?: string[];
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

  try {
    return await readApiJson<T>(response, `Request failed: ${response.status}`);
  } catch (cause) {
    if (cause instanceof Error) Object.assign(cause, { status: response.status });
    throw cause;
  }
}

export function startChestUnlock(chestId: string) {
  return postCloudAction<{ ok: boolean; readyAt?: string }>('/api/chest', { action: 'startUnlock', chestId });
}

export function openChestReward(chestId: string) {
  return postCloudAction<ChestOpenResult>('/api/chest', { action: 'open', chestId });
}

export function openAllReadyChests() {
  return postCloudAction<ChestOpenResult>('/api/chest', { action: 'openAll' });
}

export function skipChestUnlock(chestId: string, currency: 'diamonds' | 'coins' = 'diamonds') {
  return postCloudAction<{ ok: boolean; cost?: number; currency?: 'diamonds' | 'coins'; readyAt?: string }>('/api/chest', { action: 'skip', chestId, currency });
}

export function craftLegendaryChest() {
  return postCloudAction<{ ok: boolean; chestId: string; chestType: string }>('/api/chest', { action: 'craftLegendary' });
}

export type EndlessModeRewardResult = {
  ok: boolean;
  wavesCleared: number;
  rewardCoins: number;
  chestTypes: string[];
  chestInventoryFull?: boolean;
};

function pendingEndlessRewardKey() {
  return `td_endless_pending:${localStorage.getItem('td_player_id') || getUsername()}`;
}

export async function claimEndlessModeReward(runId: string, wavesCleared: number) {
  const key = pendingEndlessRewardKey();
  const pending = JSON.stringify({ runId, wavesCleared });
  try { localStorage.setItem(key, pending); } catch { /* Storage may be disabled. */ }
  let result: EndlessModeRewardResult | null;
  try {
    result = await postCloudAction<EndlessModeRewardResult>('/api/progress', { action: 'claimEndlessReward', runId, wavesCleared });
  } catch (cause) {
    if ((cause as { status?: number })?.status === 409) {
      try { if (localStorage.getItem(key) === pending) localStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
    }
    throw cause;
  }
  if (result?.ok) {
    try {
      if (localStorage.getItem(key) === pending) localStorage.removeItem(key);
    } catch { /* The server already saved the reward. */ }
  }
  return result;
}

export async function startEndlessModeRun() {
  let pending: { runId?: unknown; wavesCleared?: unknown } | null = null;
  try { pending = JSON.parse(localStorage.getItem(pendingEndlessRewardKey()) || 'null'); } catch { /* Ignore invalid local cache. */ }
  if (typeof pending?.runId === 'string' && Number.isInteger(pending.wavesCleared)) {
    try {
      const settled = await claimEndlessModeReward(pending.runId, Number(pending.wavesCleared));
      if (!settled?.ok) throw new Error('上一局奖励尚未结算，请稍后重试');
    } catch (cause) {
      if ((cause as { status?: number })?.status !== 409) throw cause;
    }
  }
  const result = await postCloudAction<{ ok: boolean; runId: string }>('/api/progress', { action: 'startEndlessRun' });
  if (!result?.ok) throw new Error('无法开始无尽模式，请检查登录状态和网络');
  return result;
}

export function abandonEndlessModeRun(runId: string) {
  return postCloudAction<{ ok: boolean }>('/api/progress', { action: 'abandonEndlessRun', runId });
}

export function upgradeCloudTower(towerType: string) {
  return postCloudAction<{ ok: boolean; towerType: string; level: number }>('/api/upgrade', { action: 'upgrade', towerType });
}

export async function deleteCloudAccount() {
  const result = await postCloudAction<{ ok: boolean }>('/api/progress', { action: 'deleteAccount', confirm: true });
  return result?.ok === true;
}

export type PlayerNotification = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export async function getNextUnreadNotification(): Promise<PlayerNotification | null> {
  const data = await postCloudAction<{ notification?: PlayerNotification | null }>('/api/progress', { action: 'getNextNotification' });
  return data?.notification ?? null;
}

export async function markNotificationRead(notificationId: string) {
  const result = await postCloudAction<{ ok: boolean; marked?: boolean }>('/api/progress', {
    action: 'markNotificationRead',
    notificationId,
  });
  return result?.ok === true;
}

export function unlockLevelWithKey(levelId: string) {
  return postCloudAction<{ ok: boolean; remainingKeys: number }>('/api/progress', { action: 'unlockWithKey', levelId });
}

export async function hasReadReleaseAnnouncement(version: string) {
  const token = getToken();
  if (!token) return null;
  const response = await fetch(`/api/announcement?version=${encodeURIComponent(version)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const data = await readApiJson<{ seen?: boolean }>(response, 'Failed to load announcement');
  return data?.seen === true;
}

export async function acknowledgeReleaseAnnouncement(version: string) {
  const result = await postCloudAction<{ ok: boolean }>('/api/announcement', { version });
  return result?.ok === true;
}
