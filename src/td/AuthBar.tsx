import { useEffect, useState } from 'react';
import { fetchCloudProgress, getToken, getUsername, loginUser, registerUser } from './authProgress';
import type { HubData } from './appTypes';
import { getErrorMessage } from './errors';

type AuthBarProps = {
  onAuthed?: () => void;
  variant?: 'bar' | 'card';
  onShowAbout?: () => void;
  onNavigateBook?: () => void;
  onNavigateRanking?: () => void;
  onNavigateTasks?: () => void;
  onNavigateGarden?: () => void;
  onNavigateStudy?: () => void;
  wallet?: Pick<HubData, 'coins' | 'diamonds' | 'experience'>;
};

type QuickWallet = {
  username?: string | null;
  coins?: number | null;
  diamonds?: number | null;
  experience?: number | null;
};

export default function AuthBar({
  onAuthed,
  variant = 'bar',
  onShowAbout,
  onNavigateBook,
  onNavigateRanking,
  onNavigateTasks,
  onNavigateGarden,
  onNavigateStudy,
  wallet,
}: AuthBarProps) {
  const [username, setUsername] = useState(() => getUsername() || '');
  const [password, setPassword] = useState('');
  const [me, setMe] = useState<QuickWallet>({ username: getUsername(), coins: null, diamonds: null, experience: null });
  const authed = Boolean(getToken());

  async function refresh() {
    try {
      if (!getToken()) return;
      const data = await fetchCloudProgress();
      setMe({
        username: getUsername(),
        coins: data.coins,
        diamonds: data.diamonds,
        experience: data.experience,
      });
    } catch {
      // The quick bar must never block page navigation when a refresh fails.
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const handleRegister = async () => {
    try {
      await registerUser(username, password);
      setMe({ username, coins: null, diamonds: null, experience: null });
      await refresh();
      onAuthed?.();
    } catch (error: unknown) {
      alert(`注册失败：${getErrorMessage(error, '网络或服务不可用')}`);
    }
  };

  const handleLogin = async () => {
    try {
      await loginUser(username, password);
      setMe({ username, coins: null, diamonds: null, experience: null });
      await refresh();
      onAuthed?.();
    } catch (error: unknown) {
      alert(`登录失败：${getErrorMessage(error, '网络或服务不可用')}`);
    }
  };

  if (variant === 'card') {
    return (
      <div className="form-stack">
        <input className="input-field" value={username} onChange={event => setUsername(event.target.value)} placeholder="用户名" />
        <input className="input-field" value={password} onChange={event => setPassword(event.target.value)} placeholder="密码" type="password" />
        <div className="button-row" style={{ marginTop: 6 }}>
          <button onClick={handleRegister} className="action-button" style={{ flex: 1 }}>注册</button>
          <button onClick={handleLogin} className="action-button primary" style={{ flex: 1 }}>登录</button>
        </div>
      </div>
    );
  }

  return (
    <div className="top-nav">
      <div className="nav-inner">
        {authed && me.username ? (
          <div className="nav-meta">
            <span>已登录：{me.username}</span>
            <span>金币：{wallet?.coins ?? me.coins ?? '-'}</span>
            <span>钻石：{wallet?.diamonds ?? me.diamonds ?? '-'}</span>
            <span>经验：{wallet?.experience ?? me.experience ?? '-'}</span>
            <button onClick={refresh} className="action-button">刷新</button>
            {onNavigateTasks && <button onClick={onNavigateTasks} className="action-button">任务</button>}
            {onNavigateGarden && <button onClick={onNavigateGarden} className="action-button">花园</button>}
            {onNavigateStudy && <button onClick={onNavigateStudy} className="action-button">学习</button>}
            {onNavigateBook && <button onClick={onNavigateBook} className="action-button">图鉴</button>}
            {onNavigateRanking && <button onClick={onNavigateRanking} className="action-button">排行榜</button>}
          </div>
        ) : (
          <div className="nav-actions">
            <input className="input-field" value={username} onChange={event => setUsername(event.target.value)} placeholder="用户名" style={{ width: 150, padding: '8px 10px' }} />
            <input className="input-field" value={password} onChange={event => setPassword(event.target.value)} placeholder="密码" type="password" style={{ width: 150, padding: '8px 10px' }} />
            <button onClick={handleRegister} className="action-button">注册</button>
            <button onClick={handleLogin} className="action-button primary">登录</button>
          </div>
        )}
        <div className="nav-spacer" />
        <div className="nav-actions">
          <a className="icon-button" href="https://github.com/6gdfg/towerdefence" target="_blank" rel="noopener noreferrer" title="GitHub" aria-label="GitHub">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          {onShowAbout && <button onClick={onShowAbout} className="action-button">关于</button>}
        </div>
      </div>
    </div>
  );
}
