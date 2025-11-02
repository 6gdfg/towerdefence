// 认证相关函数
export function getUsername(): string {
  return localStorage.getItem('td_username') || '';
}

export function setUsername(name: string): void {
  localStorage.setItem('td_username', name);
}

export async function loginUser(username: string, password: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const resp = await fetch('/api/auth?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await resp.json();
    if (data.token) {
      localStorage.setItem('td_token', data.token);
      setUsername(username);
    }
    return data;
  } catch {
    return { ok: false, error: '网络错误' };
  }
}

export async function registerUser(username: string, password: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const resp = await fetch('/api/auth?action=register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await resp.json();
    if (data.token) {
      localStorage.setItem('td_token', data.token);
      setUsername(username);
    }
    return data;
  } catch {
    return { ok: false, error: '网络错误' };
  }
}

export async function fetchCloudProgress(): Promise<any> {
  const token = getToken();
  if (!token) throw new Error('No token');
  const playerId = getPlayerId();
  const resp = await fetch(`/api/progress?playerId=${playerId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resp.ok) throw new Error('Failed to fetch progress');
  return resp.json();
}

export function clearAuth(): void {
  localStorage.removeItem('td_token');
  localStorage.removeItem('td_username');
}

export function getPlayerId(): string {
  const KEY_PID = 'td_player_id';
  let id = localStorage.getItem(KEY_PID);
  if (!id) {
    id = `p_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem(KEY_PID, id);
  }
  return id;
}

export function getToken(): string | null {
  return localStorage.getItem('td_token') || null;
}
