import { STAR_REWARD_CONFIG } from '../../shared/rewards';
import { LEVEL_UNLOCK_REQUIREMENTS } from '../../shared/unlocks';
import { STAR_LABELS } from './appConfig';
import { DIFFICULTY_CONFIG, LEVELS } from './levels';
import { MAPS } from './maps';
import { getAllStars, getMaxStarSync } from './progress';
import { resolveChestTypeLabel, resolveUnlockItemLabel } from './labels';

type LevelSelectPageProps = {
  unlocked: number;
  magicKeys: number;
  starSel: Record<number, 1 | 2 | 3>;
  unlockedItemsSet: Set<string>;
  onBack: () => void;
  onSelectStar: (levelIndex: number, star: 1 | 2 | 3) => void;
  onStartLevel: (levelIndex: number) => void;
  onUnlockLevel: (levelId: string, levelName: string) => void;
};

export default function LevelSelectPage({
  unlocked,
  magicKeys,
  starSel,
  unlockedItemsSet,
  onBack,
  onSelectStar,
  onStartLevel,
  onUnlockLevel,
}: LevelSelectPageProps) {
  const allStars = getAllStars();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h2 style={{ fontSize: 20, margin:0 }}>选择关卡</h2>
        <button onClick={onBack} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff' }}>返回主界面</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {LEVELS.map((L, i) => {
          const clearedMax = getMaxStarSync(L.id);
          const hasStarRecord = L.id in allStars;
          const isLocked = (i + 1 > unlocked) && !hasStarRecord;
          const M = MAPS.find(m => m.id === L.mapId);
          const selectedStar = (starSel[i] ?? 1) as 1|2|3;
          const levelNumber = i + 1;
          const unlockInfos = LEVEL_UNLOCK_REQUIREMENTS.filter(rule => rule.level === levelNumber);
          return (
            <div
              key={L.id}
              className="card-enter"
              style={{
                border:'1px solid #e5e7eb',
                borderRadius:12,
                padding:12,
                background:'#fff',
                boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
                animationDelay: `${i * 0.05}s`,
                opacity: 0,
              }}
            >
              <div style={{ fontWeight:700, marginBottom:8 }}>{`第${i+1}关 ${L.name}`}</div>
              <div style={{ display:'flex', gap:8, fontSize:12, color:'#6b7280' }}>
                <span>地图: {M ? `#${M.id} ${M.name}` : `#${L.mapId}`}</span>
                <span>起始金币: {L.startGold}</span>
                <span>生命: {L.lives}</span>
                <span>波数: {L.waves.length}</span>
              </div>
              {unlockInfos.length > 0 && (
                <div style={{ marginTop:6, fontSize:12, color:'#f97316', display:'flex', flexDirection:'column', gap:2 }}>
                  {unlockInfos.map(info => {
                    const isItemUnlocked = unlockedItemsSet.has(info.itemId);
                    const itemLabel = resolveUnlockItemLabel(info.itemId);
                    const starLabel = STAR_LABELS[info.star];
                    return (
                      <span key={`${info.level}-${info.itemId}`}>
                        {starLabel}通关可解锁{itemLabel}{isItemUnlocked ? '（已获得）' : ''}
                      </span>
                    );
                  })}
                </div>
              )}
              <div style={{ marginTop: 8, display:'flex', alignItems:'center', gap:6 }}>
                {[1,2,3].map((s) => {
                  const star = s as 1 | 2 | 3;
                  const disabled = isLocked;
                  const reward = STAR_REWARD_CONFIG[star];
                  const cleared = clearedMax >= s;
                  const active = selectedStar === star;
                  return (
                    <button key={s}
                      onClick={() => onSelectStar(i, star)}
                      disabled={disabled}
                      title={`${STAR_LABELS[star]}：怪物等级 +${DIFFICULTY_CONFIG.STAR_LEVEL_ADD[star]}，奖励 ${reward.coins.min}-${reward.coins.max} 金币 + ${resolveChestTypeLabel(reward.chestType)}`}
                      style={{
                        width: 30, height: 28, borderRadius: 6,
                        border: active ? '2px solid #111827' : '1px solid #d1d5db',
                        background: disabled ? '#f3f4f6' : '#fff',
                        color: cleared ? '#f59e0b' : '#9ca3af',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}>★</button>
                  );
                })}
                <span style={{ fontSize:12, color:'#6b7280' }}>星级</span>
              </div>
              <div style={{ marginTop:6, fontSize:12, color:'#6b7280' }}>
                {(() => {
                  const reward = STAR_REWARD_CONFIG[selectedStar];
                  return `${STAR_LABELS[selectedStar]}：怪物等级 +${DIFFICULTY_CONFIG.STAR_LEVEL_ADD[selectedStar]}；奖励 ${reward.coins.min}-${reward.coins.max} 金币 + ${resolveChestTypeLabel(reward.chestType)}`;
                })()}
              </div>
              <div style={{ display:'flex', gap:6, marginTop:10 }}>
                <button onClick={() => onStartLevel(i)} disabled={isLocked} style={{ flex:1, padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:isLocked?'#f3f4f6':'#fff', color:isLocked?'#9ca3af':'#111827', cursor:isLocked?'not-allowed':'pointer' }}>
                  {isLocked ? '未解锁' : `开始（★${selectedStar}）` }
                </button>
                {isLocked && magicKeys > 0 && (
                  <button onClick={() => onUnlockLevel(L.id, L.name)} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #f59e0b', background:'#fff', color:'#f59e0b', cursor:'pointer', whiteSpace:'nowrap' }}>
                    🔑解锁
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
