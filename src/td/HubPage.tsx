import type { ReactNode } from 'react';
import { DEFAULT_UNLOCKED_ITEMS, getUpgradeCost } from '../../shared/unlocks';
import { ELEMENT_TYPES, PLANT_TYPES } from './appConfig';
import type { HubData } from './appTypes';
import { resolveChestTypeLabel } from './labels';
import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG } from './plants';

type HubPageProps = {
  hub: HubData | null;
  nowTick: number;
  openingChestId: string | null;
  onLogout: () => void;
  onRefresh: () => void;
  onUpgradeTower: (towerType: string) => void;
  onStartUnlock: (chestId: string) => void;
  onOpenChest: (chestId: string) => void;
  onSkipChest: (chestId: string) => void;
  onStartGame: () => void;
  onOpenFunMode: () => void;
};

const statusLabel: Record<string, string> = {
  locked: '待解锁',
  unlocking: '解锁中',
  ready: '可开启',
  opened: '已打开',
};

export default function HubPage({
  hub,
  nowTick,
  openingChestId,
  onLogout,
  onRefresh,
  onUpgradeTower,
  onStartUnlock,
  onOpenChest,
  onSkipChest,
  onStartGame,
  onOpenFunMode,
}: HubPageProps) {
  const unlockedSet = new Set(hub?.unlockedItems ?? DEFAULT_UNLOCKED_ITEMS);
  const disableOpen = openingChestId !== null;
  const chests = hub?.chests ?? [];

  return (
    <main className="page-wrap">
      <section className="glass-panel hero-panel card-enter" style={{ opacity: 0, animationDelay: '0s' }}>
        <div className="page-title-row">
          <div>
            <div className="eyebrow">云端进度</div>
            <h1>主界面</h1>
            <p>账号资产、植物升级和宝箱都在这里管理。</p>
          </div>
          <div className="button-row">
            <button onClick={onRefresh} className="action-button">刷新云端</button>
            <button onClick={onLogout} className="action-button danger">退出账号</button>
          </div>
        </div>

        <div className="stats-row">
          <div className="metric-pill">
            <span>金币</span>
            <strong>{hub?.coins ?? '-'}</strong>
          </div>
          <div className="metric-pill">
            <span>神奇钥匙</span>
            <strong>{hub?.magicKeys ?? 0}</strong>
          </div>
          <div className="metric-pill">
            <span>宝箱</span>
            <strong>{chests.length}</strong>
          </div>
        </div>

        <div className="button-row" style={{ marginTop: 22 }}>
          <button onClick={onStartGame} className="action-button primary">开始游戏</button>
          <button onClick={onOpenFunMode} className="action-button">趣味模式</button>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="soft-card card-enter" style={{ opacity: 0, animationDelay: '0.08s', padding: 16 }}>
          <div className="section-title">植物升级</div>
          <div className="item-list">
            {PLANT_TYPES.map(t => {
              const lv = hub?.towerLevels?.[t] ?? 1;
              const shards = hub?.plantShards?.[t] ?? hub?.shards?.[t] ?? 0;
              const cost = getUpgradeCost(lv);
              const isUnlocked = unlockedSet.has(t);
              const can = isUnlocked && (hub?.coins ?? 0) >= cost.coins && shards >= cost.fragments;
              const label = BASE_PLANTS_CONFIG[t]?.name ?? t;
              return (
                <div key={t} className="item-row">
                  <div>
                    <div className="item-name">{label}</div>
                    <div className="muted">
                      {isUnlocked ? (
                        <>lv.{lv} 植物碎片：{shards} / 需求 {cost.fragments}；金币需求 {cost.coins}</>
                      ) : (
                        <span className="warning-text">未解锁</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onUpgradeTower(t)}
                    disabled={!can}
                    className="action-button"
                    style={{ opacity: can ? 1 : 0.52 }}
                  >
                    升级
                  </button>
                </div>
              );
            })}
          </div>

          <div className="section-kicker">元素增幅</div>
          <div className="item-list">
            {ELEMENT_TYPES.map(el => {
              const key = `element:${el}`;
              const lv = hub?.towerLevels?.[key] ?? 1;
              const shards = hub?.elementShards?.[el] ?? hub?.shards?.[key] ?? 0;
              const cost = getUpgradeCost(lv);
              const cfg = ELEMENT_PLANT_CONFIG[el];
              const isUnlocked = unlockedSet.has(key);
              const can = isUnlocked && (hub?.coins ?? 0) >= cost.coins && shards >= cost.fragments;
              return (
                <div key={key} className="item-row">
                  <div>
                    <div className="item-name">{cfg?.name ?? key}</div>
                    <div className="muted">
                      {isUnlocked ? (
                        <>lv.{lv} 元素碎片：{shards} / 需求 {cost.fragments}；金币需求 {cost.coins}</>
                      ) : (
                        <span className="warning-text">未解锁</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onUpgradeTower(key)}
                    disabled={!can}
                    className="action-button"
                    style={{ borderColor: cfg?.color ?? 'rgba(15,23,42,0.10)', opacity: can ? 1 : 0.52 }}
                  >
                    升级
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="soft-card card-enter" style={{ opacity: 0, animationDelay: '0.14s', padding: 16 }}>
          <div className="section-title">宝箱仓库</div>
          {chests.length === 0 ? (
            <div className="muted">暂无宝箱。</div>
          ) : (
            <div className="chest-grid">
              {chests.map(c => {
                const status = c.status;
                const isOpening = openingChestId === c.chest_id;
                const chestType = typeof c.chest_type === 'string' ? c.chest_type : 'common';
                let action: ReactNode = null;
                let extraAction: ReactNode = null;

                if (status === 'locked') {
                  action = (
                    <button onClick={() => onStartUnlock(c.chest_id)} className="action-button">
                      开始解锁
                    </button>
                  );
                }

                if (status === 'unlocking') {
                  const readyAt = c.unlock_ready_at ? new Date(c.unlock_ready_at).getTime() : 0;
                  const left = Math.max(0, Math.floor((readyAt - nowTick) / 1000));
                  const minutes = Math.max(1, Math.ceil(left / 60));
                  const skipCost = minutes * 20;
                  if (left <= 0) {
                    action = (
                      <button onClick={() => onOpenChest(c.chest_id)} disabled={disableOpen} className="action-button primary" style={{ opacity: disableOpen ? 0.56 : 1 }}>
                        {isOpening ? '开启中...' : '开箱'}
                      </button>
                    );
                  } else {
                    const mm = Math.floor(left / 60).toString().padStart(2, '0');
                    const ss = (left % 60).toString().padStart(2, '0');
                    const canSkip = (hub?.coins ?? 0) >= skipCost;
                    action = <div className="muted">解锁中 {mm}:{ss}</div>;
                    extraAction = (
                      <button onClick={() => onSkipChest(c.chest_id)} disabled={!canSkip} className="action-button" style={{ color: canSkip ? '#b45309' : '#9ca3af', opacity: canSkip ? 1 : 0.58 }}>
                        金币跳过（{skipCost}）
                      </button>
                    );
                  }
                }

                if (status === 'ready') {
                  action = (
                    <button onClick={() => onOpenChest(c.chest_id)} disabled={disableOpen} className="action-button primary" style={{ opacity: disableOpen ? 0.56 : 1 }}>
                      {isOpening ? '开启中...' : '开箱'}
                    </button>
                  );
                }

                if (status === 'opened') {
                  action = <div className="muted">已打开</div>;
                }

                return (
                  <div key={c.chest_id} className="chest-card">
                    <div className="item-name">{resolveChestTypeLabel(chestType)}</div>
                    <div className="muted">状态：{statusLabel[status] ?? status}</div>
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {action}
                      {extraAction}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
