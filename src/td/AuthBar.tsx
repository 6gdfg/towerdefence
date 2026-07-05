import { useState } from 'react';
import { fetchCloudProgress, getToken, getUsername, loginUser, registerUser } from './authProgress';
import { getErrorMessage } from './errors';
import { btnStyle } from './ui';

type AuthBarProps = {
  onAuthed?: () => void;
  variant?: 'bar' | 'card';
  onShowAbout?: () => void;
  onNavigateBook?: () => void;
  onNavigateRanking?: () => void;
};

export default function AuthBar({
  onAuthed,
  variant = 'bar',
  onShowAbout,
  onNavigateBook,
  onNavigateRanking,
}: AuthBarProps) {
  const [username, setUsername] = useState<string>(() => getUsername() || '');
  const [password, setPassword] = useState<string>('');
  const [me, setMe] = useState<{ username?: string | null; coins?: number | null; magicKeys?: number | null }>({
    username: getUsername(),
    coins: null,
    magicKeys: null,
  });
  const authed = !!getToken();

  async function refresh() {
    try {
      if (!getToken()) return;
      const data = await fetchCloudProgress();
      setMe({ username: getUsername(), coins: data.coins, magicKeys: data.magicKeys });
    } catch {
      // The top bar is informational; failed refresh should not block navigation.
    }
  }

  const handleRegister = async () => {
    try {
      await registerUser(username, password);
      setMe({ username, coins: null });
      await refresh();
      onAuthed?.();
    } catch (e: unknown) {
      alert('注册失败：' + getErrorMessage(e, '网络或服务不可用'));
    }
  };

  const handleLogin = async () => {
    try {
      await loginUser(username, password);
      setMe({ username, coins: null });
      await refresh();
      onAuthed?.();
    } catch (e: unknown) {
      alert('登录失败：' + getErrorMessage(e, '网络或服务不可用'));
    }
  };

  if (variant === 'card') {
    return (
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="用户名" style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" type="password" style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={handleRegister} className="btn-hover" style={{ flex: 1, ...btnStyle() }}>注册</button>
            <button onClick={handleLogin} className="btn-hover" style={{ flex: 1, ...btnStyle() }}>登录</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {authed && me.username ? (
          <>
            <span style={{ fontSize: 13, color: '#6b7280' }}>已登录：{me.username}</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>金币：{me.coins ?? '-'}</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>钥匙：{me.magicKeys ?? 0}</span>
            <button onClick={refresh} className="btn-hover" style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}>刷新</button>
            {onNavigateBook && (
              <button onClick={onNavigateBook} className="btn-hover" style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}>图鉴</button>
            )}
            {onNavigateRanking && (
              <button onClick={onNavigateRanking} className="btn-hover" style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}>排行榜</button>
            )}
          </>
        ) : (
          <>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="用户名" style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" type="password" style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            <button onClick={handleRegister} className="btn-hover" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}>注册</button>
            <button onClick={handleLogin} className="btn-hover" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}>登录</button>
          </>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="https://github.com/6gdfg/towerdefence" target="_blank" rel="noopener noreferrer" title="GitHub" style={{ color: '#111827', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          <button onClick={onShowAbout} className="btn-hover" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}>关于</button>
        </div>
      </div>
    </div>
  );
}
