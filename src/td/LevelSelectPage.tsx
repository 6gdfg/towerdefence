import { LEVEL_UNLOCK_REQUIREMENTS } from '../../shared/unlocks';
import { STAR_LABELS } from './appConfig';
import { LEVELS } from './levels';
import { MAPS } from './maps';
import { getAllStars, getMaxStarSync } from './progress';
import { resolveUnlockItemLabel } from './labels';

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
    <main className="page-wrap">
      <section className="glass-panel hero-panel card-enter" style={{ opacity: 0, animationDelay: '0s' }}>
        <div className="page-title-row">
          <div>
            <div className="eyebrow">Campaign</div>
            <h1>选择关卡</h1>
          </div>
          <div className="button-row">
            <div className="metric-pill" style={{ minWidth: 108 }}>
              <span>神奇钥匙</span>
              <strong>{magicKeys}</strong>
            </div>
            <button onClick={onBack} className="action-button">返回主界面</button>
          </div>
        </div>
      </section>

      <section className="level-grid" style={{ marginTop: 16 }}>
        {LEVELS.map((L, i) => {
          const clearedMax = getMaxStarSync(L.id);
          const hasStarRecord = L.id in allStars;
          const isLocked = (i + 1 > unlocked) && !hasStarRecord;
          const M = MAPS.find(m => m.id === L.mapId);
          const selectedStar = (starSel[i] ?? 1) as 1 | 2 | 3;
          const levelNumber = i + 1;
          const unlockInfos = LEVEL_UNLOCK_REQUIREMENTS.filter(rule => rule.level === levelNumber);

          return (
            <article
              key={L.id}
              className="soft-card level-card card-enter"
              style={{
                opacity: 0,
                animationDelay: `${0.04 + i * 0.035}s`,
              }}
            >
              <div className="item-name" style={{ marginBottom: 8 }}>{`第 ${i + 1} 关 ${L.name}`}</div>
              <div className="muted" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px' }}>
                <span>地图：{M ? `#${M.id} ${M.name}` : `#${L.mapId}`}</span>
                <span>金币：{L.startGold}</span>
                <span>生命：{L.lives}</span>
                <span>波数：{L.waves.length}</span>
              </div>

              {unlockInfos.length > 0 && (
                <div className="muted warning-text" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {unlockInfos.map(info => {
                    const isItemUnlocked = unlockedItemsSet.has(info.itemId);
                    const itemLabel = resolveUnlockItemLabel(info.itemId);
                    const starLabel = STAR_LABELS[info.star];
                    return (
                      <span key={`${info.level}-${info.itemId}`}>
                        {starLabel}通关解锁{itemLabel}{isItemUnlocked ? '（已获得）' : ''}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="button-row" style={{ marginTop: 12, marginBottom: 12 }}>
                {[1, 2, 3].map((s) => {
                  const star = s as 1 | 2 | 3;
                  const cleared = clearedMax >= s;
                  const active = selectedStar === star;
                  return (
                    <button
                      key={s}
                      onClick={() => onSelectStar(i, star)}
                      disabled={isLocked}
                      className="star-button"
                      style={{
                        border: active ? '2px solid #172033' : '1px solid rgba(148, 163, 184, 0.55)',
                        background: isLocked ? 'rgba(241,245,249,0.72)' : active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.58)',
                        color: cleared ? '#f59e0b' : active ? '#172033' : '#94a3b8',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ★
                    </button>
                  );
                })}
                <span className="muted">{STAR_LABELS[selectedStar]}</span>
              </div>

              <div className="button-row">
                <button
                  onClick={() => onStartLevel(i)}
                  disabled={isLocked}
                  className={isLocked ? 'action-button' : 'action-button primary'}
                  style={{ flex: 1, opacity: isLocked ? 0.54 : 1 }}
                >
                  {isLocked ? '未解锁' : `开始（${STAR_LABELS[selectedStar]}）`}
                </button>
                {isLocked && magicKeys > 0 && (
                  <button onClick={() => onUnlockLevel(L.id, L.name)} className="action-button" style={{ color: '#b45309' }}>
                    解锁
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
