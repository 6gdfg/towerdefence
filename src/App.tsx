import { useState, useEffect } from 'react';
import TDGame from './td/TDGame';
import { useTDStore } from './td/store';
import { LEVELS, DIFFICULTY_CONFIG, MONSTER_BASE_STATS } from './td/levels';
import { MAPS, getPlantGrid } from './td/maps';
import { getUsername, loginUser, registerUser, fetchCloudProgress, getPlayerId, getToken, clearAuth } from './td/authProgress';
import { getUnlocked, setUnlocked as setUnlockedPersist, getMaxStarSync, setStarCleared, refreshCache, initCache, getUnlockedItems, DEFAULT_UNLOCKED_ITEMS } from './td/progress';
import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG } from './td/plants';
import { ElementType, PlantType } from './td/types';

// 统一按钮样式（hover 效果在 index.css 中定义）
const btnStyle = (disabled = false): React.CSSProperties => ({
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: disabled ? '#f3f4f6' : '#fff',
  color: disabled ? '#9ca3af' : '#111827',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.15s ease',
});

const PLANT_TYPES: PlantType[] = ['sunflower','bottleGrass','fourLeafClover','machineGun','sniper'];
const ELEMENT_TYPES: ElementType[] = ['fire','wind','ice','electric','gold'];

function resolveShardLabel(key: string): string {
  if (BASE_PLANTS_CONFIG[key as PlantType]) {
    return BASE_PLANTS_CONFIG[key as PlantType].name;
  }
  if (key.startsWith('element:')) {
    const elementId = key.split(':')[1] as ElementType;
    const cfg = ELEMENT_PLANT_CONFIG[elementId];
    if (cfg) return `${cfg.name}碎片`;
  }
  return key;
}

function AuthBar({ onAuthed, variant = 'bar' }: { onAuthed?: () => void; variant?: 'bar' | 'card' }) {
  const [username, setUsername] = useState<string>(() => getUsername() || '');
  const [password, setPassword] = useState<string>('');
  const [me, setMe] = useState<{ username?: string|null; coins?: number|null }>({ username: getUsername(), coins: null });
  const authed = !!getToken();

  async function refresh() {
    try {
      const token = getToken();
      if (!token) return;
      const data = await fetchCloudProgress();
      setMe({ username: getUsername(), coins: data.coins });
    } catch {}
  }

  const handleRegister = async () => {
    try { await registerUser(username, password); setMe({ username, coins: null }); await refresh(); onAuthed && onAuthed(); }
    catch (e: any) { alert('注册失败：' + (e?.message || '网络或服务不可用')); }
  };
  const handleLogin = async () => {
    try { await loginUser(username, password); setMe({ username, coins: null }); await refresh(); onAuthed && onAuthed(); }
    catch (e: any) { alert('登录失败：' + (e?.message || '网络或服务不可用')); }
  };

  if (variant === 'card') {
    return (
      <div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="用户名" style={{ padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6 }} />
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="密码" type="password" style={{ padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6 }} />
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button onClick={handleRegister} className="btn-hover" style={{ flex:1, ...btnStyle() }}>注册</button>
            <button onClick={handleLogin} className="btn-hover" style={{ flex:1, ...btnStyle() }}>登录</button>
          </div>
          <div style={{ fontSize:12, color:'#9ca3af', marginTop:6 }}>ID: {getPlayerId()}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb' }}>
      <div style={{ maxWidth: 900, margin:'0 auto', padding:'8px 12px', display:'flex', alignItems:'center', gap:8 }}>
        {authed && me.username ? (
          <>
            <span style={{ fontSize:13, color:'#6b7280' }}>已登录：{me.username}</span>
            <span style={{ fontSize:13, color:'#6b7280' }}>钱包金币：{me.coins ?? '-'}</span>
            <button onClick={refresh} className="btn-hover" style={{ marginLeft:8, padding:'4px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>刷新</button>
          </>
        ) : (
          <>
            <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="用户名" style={{ padding:'4px 8px', border:'1px solid #d1d5db', borderRadius:6 }} />
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="密码" type="password" style={{ padding:'4px 8px', border:'1px solid #d1d5db', borderRadius:6 }} />
            <button onClick={handleRegister} className="btn-hover" style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>注册</button>
            <button onClick={handleLogin} className="btn-hover" style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>登录</button>
          </>
        )}
        <div style={{ marginLeft:'auto', fontSize:12, color:'#9ca3af' }}>ID: {getPlayerId()}</div>
      </div>
    </div>
  );
}


function App() {
  const loadLevel = useTDStore(s => s.loadLevel);
  const [stage, setStage] = useState<'auth'|'hub'|'select'|'playing'|'won'|'lost'>(() => getToken() ? 'hub' : 'auth');
  const [levelIndex, setLevelIndex] = useState<number | null>(null);
  const [unlocked, setUnlockedState] = useState<number>(() => getUnlocked());

  const [starSel, setStarSel] = useState<Record<number, 1|2|3>>({});
  const [currentStar, setCurrentStar] = useState<1|2|3>(1);

  type HubData = { coins: number; shards: Record<string, number>; towerLevels: Record<string, number>; chests: any[]; unlockedItems: string[] } | null;
  const [hub, setHub] = useState<HubData>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [winReward, setWinReward] = useState<{ coins: number; chestType: string; message?: string } | null>(null);
  useEffect(() => { const t = setInterval(()=>setNowTick(Date.now()), 1000); return ()=>clearInterval(t); }, []);
  async function loadHub() {
    try {
      const token = getToken();
      if (!token) return;
      const d = await fetchCloudProgress();
      const unlockedItems = Array.isArray(d.unlockedItems) && d.unlockedItems.length > 0 ? d.unlockedItems : [...DEFAULT_UNLOCKED_ITEMS];
      setHub({ coins: d.coins ?? 0, shards: d.shards ?? {}, towerLevels: d.towerLevels ?? {}, chests: d.chests ?? [], unlockedItems });
      // 刷新缓存
      await refreshCache();
      setHub(prev => prev ? { ...prev, unlockedItems: getUnlockedItems() } : prev);
      // 同步云端的 unlocked 状态
      if (typeof d.unlocked === 'number' && d.unlocked >= 1) {
        setUnlockedState(d.unlocked);
      } else {
        // 新用户确保至少解锁第一关
        setUnlockedState(1);
      }
    } catch {}
  }

  // 初始化缓存
  useEffect(() => {
    const init = async () => {
      await initCache();
      loadHub();
    };
    init();
  }, []);

  type ChestReward = { shards: Record<string, number>; coins: number; chestType: string } | null;
  const [chestReward, setChestReward] = useState<ChestReward>(null);

  async function startUnlock(chestId: string) {
    const token = getToken(); if (!token) return;
    await fetch('/api/chest', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ action:'startUnlock', chestId })});
    await loadHub();
  }
  async function openChest(chestId: string) {
    const token = getToken(); if (!token) return;
    const resp = await fetch('/api/chest', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ action:'open', chestId })});
    if (resp.ok) {
      const data = await resp.json();
      setChestReward({ shards: data.shards || {}, coins: data.coins || 0, chestType: data.chestType || 'common' });
    }
    await loadHub();
  }
  async function skipChest(chestId: string) {
    const token = getToken(); if (!token) return;
    await fetch('/api/chest', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ action:'skip', chestId })});
    await loadHub();
  }
  function upgradeCost(level:number){ return { frag: 5 + 3 * (Math.max(1, level)-1), coins: 100 * Math.max(1, level) }; }
  async function upgradeTower(towerType: string) {
    const token = getToken(); if (!token) return;
    await fetch('/api/upgrade', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ action:'upgrade', towerType })});
    await loadHub();
  }

  // 根据怪物等级和星级计算实际数值
  function scaleWaves(waves: import('./td/types').WaveDef[], star: 1|2|3): import('./td/types').WaveDef[] {
    return waves.map((w) => {
      return {
        groups: w.groups.map(g => {
          const baseStats = MONSTER_BASE_STATS[g.type];
          const finalLevel = g.level + DIFFICULTY_CONFIG.STAR_LEVEL_ADD[star];
          const mul = 1 + DIFFICULTY_CONFIG.LEVEL_MULTIPLIER * finalLevel;
          return {
            ...g,
            hp: Math.round(baseStats.hp * mul),
            speed: baseStats.speed,
            leakDamage: g.leakDamage ?? baseStats.leakDamage,
            level: finalLevel,
          };
        }),
      };
    });
  }



  const startLevel = (idx: number) => {
    const L = LEVELS[idx];
    const M = MAPS.find(m => m.id === L.mapId);
    if (!M) { console.warn('Map not found for level', L.mapId); return; }
    const clearedMax = getMaxStarSync(L.id);
    const chosenStar = clearedMax > 0 ? ((starSel[idx] ?? 1) as 1|2|3) : 1;
    const wavesScaled = scaleWaves(L.waves, chosenStar);
    const plantGrid = getPlantGrid(M); // 获取可种植格子点
    const unlockedItems = getUnlockedItems();
    const allowedPlantsRaw = unlockedItems.filter((item): item is PlantType => Object.prototype.hasOwnProperty.call(BASE_PLANTS_CONFIG, item));
    const allowedPlants = Array.from(new Set(allowedPlantsRaw.length > 0 ? allowedPlantsRaw : [...DEFAULT_UNLOCKED_ITEMS])) as PlantType[];
    const allowedElements = Array.from(new Set(unlockedItems
      .filter(item => item.startsWith('element:'))
      .map(item => item.split(':')[1])
      .filter((el): el is ElementType => Object.prototype.hasOwnProperty.call(ELEMENT_PLANT_CONFIG, el)))) as ElementType[];
    loadLevel(
      { startGold: L.startGold, lives: L.lives, waves: wavesScaled },
      { path: M.path, size: M.size, roadWidthCells: M.roadWidthCells, plantGrid },
      {
        autoStartFirstWave: L.autoStartFirstWave,
        firstWaveDelaySec: L.firstWaveDelaySec,
        towerLevels: hub?.towerLevels as any,
        allowedPlants,
        allowedElements,
      }
    );

    setCurrentStar(chosenStar);
    setLevelIndex(idx);
    setStage('playing');
  };

  const toNextLevel = () => {
    if (levelIndex==null) return;
    const next = levelIndex + 1;
    if (next < LEVELS.length) {
      startLevel(next);
    } else {
      // 全部通关，回到关卡选择
      setStage('select');
      setLevelIndex(null);
    }
  };

  const restartLevel = () => {
    if (levelIndex==null) return;
    startLevel(levelIndex);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', color:'#111827', fontFamily:'Arial, sans-serif' }}>
      {stage === 'auth' && (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width: 400, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:20, boxShadow:'0 10px 30px rgba(0,0,0,0.08)' }}>
            <div style={{ fontWeight:700, marginBottom:16, fontSize:18 }}>登录 / 注册</div>
            <AuthBar variant="card" onAuthed={() => { setStage('hub'); loadHub(); }} />
          </div>
        </div>
      )}

      {stage !== 'auth' && (
        <>
          {/* 简易登录/注册栏 */}
          <AuthBar />
          {stage === 'hub' && (
            <div style={{ maxWidth: 900, margin:'0 auto', padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <h2 style={{ fontSize:20, margin:0 }}>主界面</h2>
                <button onClick={() => { clearAuth(); setStage('auth'); }} className="btn-hover" style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #dc2626', background:'#fff', color:'#dc2626' }}>退出账号</button>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ padding:'6px 10px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:8 }}>金币：{hub?.coins ?? '-'}</div>
                <button onClick={loadHub} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff' }}>刷新云端</button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {/* 升级面板 */}
                <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
                  <div style={{ fontWeight:700, marginBottom:8 }}>植物升级</div>
                  {(() => {
                    const unlockedSet = new Set(hub?.unlockedItems ?? DEFAULT_UNLOCKED_ITEMS);
                    return (
                      <>
                        {PLANT_TYPES.map(t => {
                          const lv = hub?.towerLevels?.[t] ?? 1;
                          const shards = hub?.shards?.[t] ?? 0;
                          const cost = upgradeCost(lv);
                          const isUnlocked = unlockedSet.has(t);
                          const can = isUnlocked && (hub?.coins ?? 0) >= cost.coins && shards >= cost.frag;
                          const label = BASE_PLANTS_CONFIG[t]?.name ?? t;
                          return (
                            <div key={t} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderTop:'1px dashed #e5e7eb' }}>
                              <div>
                                <div style={{ fontSize:14 }}>{label}</div>
                                <div style={{ fontSize:12, color:'#6b7280' }}>
                                  {isUnlocked ? (
                                    <>lv.{lv} 碎片：{shards} / 需求 {cost.frag}；金币需求 {cost.coins}</>
                                  ) : (
                                    <span style={{ color:'#f97316' }}>未解锁</span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={()=>upgradeTower(t)}
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
                          const shards = hub?.shards?.[key] ?? 0;
                          const cost = upgradeCost(lv);
                          const cfg = ELEMENT_PLANT_CONFIG[el];
                          const isUnlocked = unlockedSet.has(key);
                          const can = isUnlocked && (hub?.coins ?? 0) >= cost.coins && shards >= cost.frag;
                          return (
                            <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderTop:'1px dashed #e5e7eb' }}>
                              <div>
                                <div style={{ fontSize:14 }}>{cfg?.name ?? key}</div>
                                <div style={{ fontSize:12, color:'#6b7280' }}>
                                  {isUnlocked ? (
                                    <>lv.{lv} 碎片：{shards} / 需求 {cost.frag}；金币需求 {cost.coins}</>
                                  ) : (
                                    <span style={{ color:'#f97316' }}>未解锁</span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={()=>upgradeTower(key)}
                                disabled={!can}
                                style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${cfg?.color ?? '#d1d5db'}`, background: can?'#fff':'#f3f4f6', color: can?'#111827':'#9ca3af' }}
                              >
                                升级
                              </button>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>

                {/* 宝箱仓库 */}
                <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
                  <div style={{ fontWeight:700, marginBottom:8 }}>宝箱仓库</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8 }}>
                    {(hub?.chests ?? []).map((c:any) => {
                      const status = c.status as string;
                      let action = null as any;
                      if (status==='locked') action = <button onClick={()=>startUnlock(c.chest_id)} style={{ padding:'6px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>开始解锁</button>;
                      let extraAction = null as any;
                      if (status==='unlocking') {
                        const readyAt = c.unlock_ready_at ? new Date(c.unlock_ready_at).getTime() : 0;
                        const left = Math.max(0, Math.floor((readyAt - nowTick)/1000));
                        const minutes = Math.max(1, Math.ceil(left / 60));
                        const skipCost = minutes * 20;
                        if (left <= 0) {
                          action = <button onClick={()=>openChest(c.chest_id)} style={{ padding:'6px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>开箱</button>;
                        } else {
                          const mm = Math.floor(left/60).toString().padStart(2,'0');
                          const ss = (left%60).toString().padStart(2,'0');
                          action = <div style={{ fontSize:12, color:'#6b7280' }}>解锁中 {mm}:{ss}</div>;
                          const canSkip = (hub?.coins ?? 0) >= skipCost;
                          extraAction = (
                            <button onClick={()=>skipChest(c.chest_id)} disabled={!canSkip} style={{ marginTop:6, padding:'4px 8px', borderRadius:6, border:'1px solid #f59e0b', background: canSkip ? '#fff7ed' : '#fef2f2', color: canSkip ? '#b45309' : '#9ca3af' }}>
                              金币跳过（{skipCost}）
                            </button>
                          );
                        }
                      }
                      if (status==='ready') action = <button onClick={()=>openChest(c.chest_id)} style={{ padding:'6px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>开箱</button>;
                      if (status==='opened') action = <div style={{ fontSize:12, color:'#6b7280' }}>已打开</div>;
                      return (
                        <div key={c.chest_id} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10 }}>
                          <div style={{ fontWeight:600 }}>宝箱</div>
                          <div style={{ fontSize:12, color:'#6b7280' }}>状态：{status}</div>
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

              {/* 中间开始按钮 */}
              <div style={{ display:'flex', justifyContent:'center', marginTop:20 }}>
                <button onClick={()=>setStage('select')} style={{ padding:'10px 16px', borderRadius:10, border:'1px solid #111827', background:'#fff', fontWeight:700 }}>开始游戏</button>
              </div>
            </div>
          )}

          {stage === 'select' && (
            <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <h2 style={{ fontSize: 20, margin:0 }}>选择关卡</h2>
                <button onClick={()=>setStage('hub')} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff' }}>返回主界面</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {LEVELS.map((L, i) => {
                  const isLocked = i + 1 > unlocked;
                  const M = MAPS.find(m => m.id === L.mapId);
                  const clearedMax = getMaxStarSync(L.id);
                  const selectedStar = (starSel[i] ?? 1) as 1|2|3;
                  return (
                    <div key={L.id} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:12, background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                      <div style={{ fontWeight:700, marginBottom:8 }}>{`第${i+1}关 ${L.name}`}</div>
                      <div style={{ display:'flex', gap:8, fontSize:12, color:'#6b7280' }}>
                        <span>地图: {M ? `#${M.id} ${M.name}` : `#${L.mapId}`}</span>
                        <span>起始金币: {L.startGold}</span>
                        <span>生命: {L.lives}</span>
                        <span>波数: {L.waves.length}</span>
                      </div>
                      <div style={{ marginTop: 8, display:'flex', alignItems:'center', gap:6 }}>
                        {[1,2,3].map((s) => {
                          const disabled = isLocked || (clearedMax === 0 && s > 1);
                          const cleared = clearedMax >= (s as number);
                          const active = selectedStar === (s as 1|2|3);
                          return (
                            <button key={s}
                              onClick={() => setStarSel(prev => ({ ...prev, [i]: s as 1|2|3 }))}
                              disabled={disabled}
                              title={`选择${s}星`}
                              style={{
                                width: 30, height: 28, borderRadius: 6,
                                border: active ? '2px solid #111827' : '1px solid #d1d5db',
                                background: disabled ? '#f3f4f6' : '#fff',
                                color: cleared ? '#f59e0b' : '#9ca3af',
                                cursor: disabled ? 'not-allowed' : 'pointer'
                              }}>★</button>
                          );
                        })}
                        <span style={{ fontSize:12, color:'#6b7280' }}>星级</span>
                      </div>
                      <button onClick={() => startLevel(i)} disabled={isLocked} style={{ marginTop:10, padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:isLocked?'#f3f4f6':'#fff', color:isLocked?'#9ca3af':'#111827', cursor:isLocked?'not-allowed':'pointer' }}>
                        {isLocked ? '未解锁' : `开始（★${selectedStar}）` }
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stage === 'playing' && (
            <TDGame
              onWin={async () => {
                if (levelIndex != null) {
                  const L = LEVELS[levelIndex];
                  const result = await setStarCleared(L.id, currentStar);
                  const unlockList = Array.isArray(result?.newUnlocks) ? (result.newUnlocks as string[]) : [];
                  if (unlockList.length > 0) {
                    setHub(prev => {
                      const base = prev ?? { coins: 0, shards: {}, towerLevels: {}, chests: [], unlockedItems: [...DEFAULT_UNLOCKED_ITEMS] };
                      const merged = new Set(base.unlockedItems ?? DEFAULT_UNLOCKED_ITEMS);
                      unlockList.forEach((item: string) => merged.add(item));
                      return { ...base, unlockedItems: Array.from(merged) };
                    });
                  }
                  if (result && result.rewardCoins > 0) {
                    const rewardMsg = result.newRecord
                      ? `🎉 新纪录！获得 ${result.rewardCoins} 金币和${result.chestType === 'common' ? '普通' : result.chestType === 'rare' ? '稀有' : '史诗'}宝箱`
                      : `✨ 重复通关！获得 ${result.rewardCoins} 金币和${result.chestType === 'common' ? '普通' : result.chestType === 'rare' ? '稀有' : '史诗'}宝箱`;
                    setWinReward({
                      coins: result.rewardCoins,
                      chestType: result.chestType || 'common',
                      message: rewardMsg
                    });
                  }
                  const prevUnlocked = getUnlocked();
                  const nextUnlock = Math.min(LEVELS.length, levelIndex + 2);
                  if (nextUnlock > prevUnlocked) {
                    setUnlockedPersist(nextUnlock);
                    setUnlockedState(nextUnlock);
                  }
                  // 刷新数据以更新星级显示
                  await loadHub();
                  // 强制更新解锁状态（确保UI刷新）
                  setUnlockedState(getUnlocked());
                }
                setStage('won');
              }}
              onLose={() => setStage('lost')}
            />
          )}

          {(stage === 'won' || stage === 'lost') && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}>
              <div style={{ width: 360, borderRadius: 12, background:'#ffffff', border:'1px solid #e5e7eb', padding:16, boxShadow:'0 10px 30px rgba(0,0,0,0.15)' }}>
                <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>
                  {stage === 'won' ? '关卡完成 🎉' : '挑战失败 💥'}
                </div>
                <div style={{ color:'#6b7280', fontSize:13, marginBottom:10 }}>
                  {levelIndex!=null ? `第${levelIndex+1}关 ${LEVELS[levelIndex].name}` : ''}
                </div>
                {stage === 'won' && winReward && winReward.coins > 0 && (
                  <div style={{ background:'#f9fafb', borderRadius:8, padding:12, marginBottom:12 }}>
                    <div style={{ fontWeight:600, marginBottom:6, color:'#059669' }}>🎁 通关奖励</div>
                    {winReward.message && (
                      <div style={{ fontSize:14, color:'#6b7280', marginBottom:6 }}>{winReward.message}</div>
                    )}
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                      <span>金币</span>
                      <span style={{ fontWeight:600, color:'#f59e0b' }}>+{winReward.coins}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginTop:4 }}>
                      <span>宝箱</span>
                      <span style={{ fontWeight:600, color:'#8b5cf6' }}>
                        {winReward.chestType === 'common' && '普通宝箱'}
                        {winReward.chestType === 'rare' && '稀有宝箱'}
                        {winReward.chestType === 'epic' && '史诗宝箱'}
                      </span>
                    </div>
                  </div>
                )}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {stage === 'won' && (
                    <>
                      {currentStar < 3 && (
                        <button onClick={() => { if (levelIndex!=null) { const nextStar = (Math.min(3, (currentStar + 1)) as 1|2|3); setStarSel(prev => ({ ...prev, [levelIndex]: nextStar })); setWinReward(null); startLevel(levelIndex); } }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>挑战更高星级</button>
                      )}
                      <button onClick={() => { setWinReward(null); toNextLevel(); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>下一关</button>
                    </>
                  )}
                  <button onClick={() => { setWinReward(null); restartLevel(); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>重玩</button>
                  <button onClick={() => { setWinReward(null); setStage('select'); setLevelIndex(null); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>返回关卡</button>
                  <button onClick={() => { setWinReward(null); setStage('hub'); setLevelIndex(null); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>返回主界面</button>
                </div>
              </div>
            </div>
          )}

          {/* 开箱奖励弹窗 */}
          {chestReward && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
              <div style={{ width: 400, borderRadius: 12, background:'#ffffff', border:'1px solid #e5e7eb', padding:20, boxShadow:'0 10px 30px rgba(0,0,0,0.15)' }}>
                <div style={{ fontWeight:700, fontSize:20, marginBottom:12, textAlign:'center' }}>🎁 宝箱开启成功！</div>
                <div style={{ fontSize:14, color:'#6b7280', marginBottom:16, textAlign:'center' }}>
                  {chestReward.chestType === 'common' && '普通宝箱'}
                  {chestReward.chestType === 'rare' && '稀有宝箱'}
                  {chestReward.chestType === 'epic' && '史诗宝箱'}
                </div>
                <div style={{ background:'#f9fafb', borderRadius:8, padding:12, marginBottom:16 }}>
                  <div style={{ fontWeight:600, marginBottom:8 }}>获得碎片：</div>
                  {Object.entries(chestReward.shards).map(([tower, count]) => {
                    const plantLabel = resolveShardLabel(tower);
                    return (
                      <div key={tower} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:14 }}>
                        <span>{plantLabel}</span>
                        <span style={{ fontWeight:600, color:'#10b981' }}>+{count}</span>
                      </div>
                    );
                  })}
                  {chestReward.coins > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:14, borderTop:'1px dashed #e5e7eb', marginTop:8, paddingTop:8 }}>
                      <span>金币</span>
                      <span style={{ fontWeight:600, color:'#f59e0b' }}>+{chestReward.coins}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setChestReward(null)} style={{ width:'100%', padding:'10px', borderRadius:8, border:'1px solid #111827', background:'#fff', fontWeight:600, cursor:'pointer' }}>确定</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;

