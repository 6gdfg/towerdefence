// 认证相关函数
import type { CloudProgress } from './appTypes';

const KEY_PID = 'td_player_id';

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

export async function loginUser(username: string, password: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const resp = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });
    const data = await resp.json();
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
    const data = await resp.json();
    if (!resp.ok || !data?.token) throw new Error(data?.error || '注册失败');
    localStorage.setItem('td_token', data.token);
    setUsername(username);
    setPlayerId(data.playerId);
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
  if (!resp.ok) throw new Error('Failed to fetch progress');
  return resp.json() as Promise<CloudProgress>;
}

export function clearAuth(): void {
  localStorage.removeItem('td_token');
  localStorage.removeItem('td_username');
  localStorage.removeItem(KEY_PID);
}

export function getToken(): string | null {
  return localStorage.getItem('td_token') || null;
}
