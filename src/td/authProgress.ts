// 认证相关函数
import type { CloudProgress } from './appTypes';
import { readApiJson } from './apiClient';

const KEY_PID = 'td_player_id';
const KEY_TUTORIAL_NEEDED_PREFIX = 'td_tutorial_needed:';
const KEY_TUTORIAL_SEEN_PREFIX = 'td_tutorial_seen:';

export function getUsername(): string {
  return localStorage.getItem('td_username') || '';
}

export function setUsername(name: string): void {
  localStorage.setItem('td_username', name);
}

function setPlayerId(playerId?: string): void {
  if (playerId) {
    localStorage.setItem(KEY_PID, playerId);
  }
}

function getTutorialKey(prefix: string): string {
  const playerId = localStorage.getItem(KEY_PID) || getUsername() || 'local';
  return `${prefix}${playerId}`;
}

export function markTutorialNeeded(): void {
  localStorage.setItem(getTutorialKey(KEY_TUTORIAL_NEEDED_PREFIX), '1');
}

export function markTutorialSeen(): void {
  localStorage.setItem(getTutorialKey(KEY_TUTORIAL_SEEN_PREFIX), '1');
  localStorage.removeItem(getTutorialKey(KEY_TUTORIAL_NEEDED_PREFIX));
}

export function shouldShowTutorial(): boolean {
  return (
    localStorage.getItem(getTutorialKey(KEY_TUTORIAL_NEEDED_PREFIX)) === '1'
    && localStorage.getItem(getTutorialKey(KEY_TUTORIAL_SEEN_PREFIX)) !== '1'
  );
}

export async function loginUser(username: string, password: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const resp = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });
    const data = await readApiJson<{ ok: boolean; token?: string; playerId?: string; error?: string }>(resp, '登录失败');
    if (!resp.ok || !data?.token) throw new Error(data?.error || '登录失败');
    localStorage.setItem('td_token', data.token);
    setUsername(username);
    setPlayerId(data.playerId);
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('网络错误');
  }
}

export async function registerUser(username: string, password: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const resp = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', username, password })
    });
    const data = await readApiJson<{ ok: boolean; token?: string; playerId?: string; error?: string }>(resp, '注册失败');
    if (!resp.ok || !data?.token) throw new Error(data?.error || '注册失败');
    localStorage.setItem('td_token', data.token);
    setUsername(username);
    setPlayerId(data.playerId);
    markTutorialNeeded();
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('网络错误');
  }
}

export async function fetchCloudProgress(): Promise<CloudProgress> {
  const token = getToken();
  if (!token) throw new Error('No token');
  const resp = await fetch('/api/progress', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return readApiJson<CloudProgress>(resp, 'Failed to fetch progress');
}

export function clearAuth(): void {
  localStorage.removeItem('td_token');
  localStorage.removeItem('td_username');
  localStorage.removeItem(KEY_PID);
}

export function getToken(): string | null {
  return localStorage.getItem('td_token') || null;
}
