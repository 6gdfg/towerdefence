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

  return (
    <div style={{ maxWidth: 900, margin:'0 auto', padding:24 }}>
      <div className="card-enter" style={{ opacity: 0, animationDelay: '0s', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h2 style={{ fontSize:20, margin:0 }}>主界面</h2>
        <button onClick={onLogout} className="btn-hover" style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #dc2626', background:'#fff', color:'#dc2626' }}>退出账号</button>
      </div>
      <div className="card-enter" style={{ opacity: 0, animationDelay: '0.05s', display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <div style={{ padding:'6px 10px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:8 }}>金币：{hub?.coins ?? '-'}</div>
        <div style={{ padding:'6px 10px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:8 }}>🔑神奇钥匙：{hub?.magicKeys ?? 0}</div>
        <button onClick={onRefresh} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff' }}>刷新云端</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="card-enter" style={{ opacity: 0, animationDelay: '0.1s', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>植物升级</div>
          {PLANT_TYPES.map(t => {
            const lv = hub?.towerLevels?.[t] ?? 1;
            const shards = hub?.plantShards?.[t] ?? hub?.shards?.[t] ?? 0;
            const cost = getUpgradeCost(lv);
            const isUnlocked = unlockedSet.has(t);
            const can = isUnlocked && (hub?.coins ?? 0) >= cost.coins && shards >= cost.fragments;
            const label = BASE_PLANTS_CONFIG[t]?.name ?? t;
            return (
              <div key={t} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderTop:'1px dashed #e5e7eb' }}>
                <div>
                  <div style={{ fontSize:14 }}>{label}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>
                    {isUnlocked ? (
                      <>lv.{lv} 植物碎片：{shards} / 需求 {cost.fragments}；金币需求 {cost.coins}</>
                    ) : (
                      <span style={{ color:'#f97316' }}>未解锁</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onUpgradeTower(t)}
                  disabled={!can}
                  style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background: can?'#fff':'#f3f4f6', color: can?'#111827':'#9ca3af' }}
                >
                  升级
                </button>
              </div>
            );
          })}
          <div style={{ fontSize:12, color:'#6b7280', marginTop:12 }}>元素增幅</div>
          {ELEMENT_TYPES.map(el => {
            const key = `element:${el}`;
            const lv = hub?.towerLevels?.[key] ?? 1;
            const shards = hub?.elementShards?.[el] ?? hub?.shards?.[key] ?? 0;
            const cost = getUpgradeCost(lv);
            const cfg = ELEMENT_PLANT_CONFIG[el];
            const isUnlocked = unlockedSet.has(key);
            const can = isUnlocked && (hub?.coins ?? 0) >= cost.coins && shards >= cost.fragments;
            return (
              <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderTop:'1px dashed #e5e7eb' }}>
                <div>
                  <div style={{ fontSize:14 }}>{cfg?.name ?? key}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>
                    {isUnlocked ? (
                      <>lv.{lv} 元素碎片：{shards} / 需求 {cost.fragments}；金币需求 {cost.coins}</>
                    ) : (
                      <span style={{ color:'#f97316' }}>未解锁</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onUpgradeTower(key)}
                  disabled={!can}
                  style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${cfg?.color ?? '#d1d5db'}`, background: can?'#fff':'#f3f4f6', color: can?'#111827':'#9ca3af' }}
                >
                  升级
                </button>
              </div>
            );
          })}
        </div>

        <div className="card-enter" style={{ opacity: 0, animationDelay: '0.15s', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>宝箱仓库</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8 }}>
            {(hub?.chests ?? []).map(c => {
              const status = c.status;
              const isOpening = openingChestId === c.chest_id;
              const chestType = typeof c.chest_type === 'string' ? c.chest_type : 'common';
              const chestCoinReward = Number(c.coin_reward ?? 0);
              let action: ReactNode = null;
              let extraAction: ReactNode = null;

              if (status === 'locked') {
                action = <button onClick={() => onStartUnlock(c.chest_id)} style={{ padding:'6px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>开始解锁</button>;
              }
              if (status === 'unlocking') {
                const readyAt = c.unlock_ready_at ? new Date(c.unlock_ready_at).getTime() : 0;
                const left = Math.max(0, Math.floor((readyAt - nowTick) / 1000));
                const minutes = Math.max(1, Math.ceil(left / 60));
                const skipCost = minutes * 20;
                if (left <= 0) {
                  action = (
                    <button
                      onClick={() => onOpenChest(c.chest_id)}
                      disabled={disableOpen}
                      style={{
                        padding:'6px 8px',
                        borderRadius:6,
                        border:'1px solid #d1d5db',
                        background: disableOpen ? '#f3f4f6' : '#fff',
                        color: disableOpen ? '#9ca3af' : '#111827',
                        cursor: disableOpen ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isOpening ? '开启中…' : '开箱'}
                    </button>
                  );
                } else {
                  const mm = Math.floor(left / 60).toString().padStart(2, '0');
                  const ss = (left % 60).toString().padStart(2, '0');
                  const canSkip = (hub?.coins ?? 0) >= skipCost;
                  action = <div style={{ fontSize:12, color:'#6b7280' }}>解锁中 {mm}:{ss}</div>;
                  extraAction = (
                    <button onClick={() => onSkipChest(c.chest_id)} disabled={!canSkip} style={{ marginTop:6, padding:'4px 8px', borderRadius:6, border:'1px solid #f59e0b', background: canSkip ? '#fff7ed' : '#fef2f2', color: canSkip ? '#b45309' : '#9ca3af' }}>
                      金币跳过（{skipCost}）
                    </button>
                  );
                }
              }
              if (status === 'ready') {
                action = (
                  <button
                    onClick={() => onOpenChest(c.chest_id)}
                    disabled={disableOpen}
                    style={{
                      padding:'6px 8px',
                      borderRadius:6,
                      border:'1px solid #d1d5db',
                      background: disableOpen ? '#f3f4f6' : '#fff',
                      color: disableOpen ? '#9ca3af' : '#111827',
                      cursor: disableOpen ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isOpening ? '开启中…' : '开箱'}
                  </button>
                );
              }
              if (status === 'opened') {
                action = <div style={{ fontSize:12, color:'#6b7280' }}>已打开</div>;
              }

              return (
                <div key={c.chest_id} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10 }}>
                  <div style={{ fontWeight:600 }}>{resolveChestTypeLabel(chestType)}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>状态：{status}</div>
                  {chestCoinReward > 0 && (
                    <div style={{ fontSize:12, color:'#b45309' }}>箱内金币：+{chestCoinReward}</div>
                  )}
                  <div style={{ marginTop:6, display:'flex', flexDirection:'column', gap:4 }}>
                    {action}
                    {extraAction}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card-enter" style={{ opacity: 0, animationDelay: '0.2s', display:'flex', justifyContent:'center', gap:12, marginTop:20 }}>
        <button onClick={onStartGame} style={{ padding:'10px 16px', borderRadius:10, border:'1px solid #111827', background:'#fff', fontWeight:700 }}>开始游戏</button>
        <button onClick={onOpenFunMode} style={{ padding:'10px 16px', borderRadius:10, border:'1px solid #0f172a', background:'#f8fafc', fontWeight:700 }}>趣味模式</button>
      </div>
    </div>
  );
}
