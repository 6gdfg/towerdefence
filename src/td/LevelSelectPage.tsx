import { LEVEL_UNLOCK_REQUIREMENTS } from '../../shared/unlocks';
import { STAR_LABELS } from './appConfig';
import { getChapterById, getChapterLevelLabel } from './chapters';
import { LEVELS } from './levels';
import { MAPS } from './maps';
import { getAllStars, getMaxStarSync } from './progress';
import { resolveUnlockItemLabel } from './labels';
import { getLevelDifficultyRatings } from './levelRatings';

type LevelSelectPageProps = {
  unlocked: number;
  magicKeys: number;
  starSel: Record<number, 1 | 2 | 3>;
  unlockedItemsSet: Set<string>;
  chapterId: number;
  onBack: () => void;
  onSelectStar: (levelIndex: number, star: 1 | 2 | 3) => void;
  onStartLevel: (levelIndex: number) => void;
  onUnlockLevel: (levelId: string, levelName: string) => void;
};

const CORE_DIFFICULTIES = [
  { label: 'EZ', star: 1, tone: 'ez' },
  { label: 'HD', star: 2, tone: 'hd' },
  { label: 'IN', star: 3, tone: 'in' },
] as const;

export default function LevelSelectPage({
  unlocked,
  magicKeys,
  starSel,
  unlockedItemsSet,
  chapterId,
  onBack,
  onSelectStar,
  onStartLevel,
  onUnlockLevel,
}: LevelSelectPageProps) {
  const allStars = getAllStars();
  const chapter = getChapterById(chapterId);
  const chapterLevels = LEVELS
    .map((level, index) => ({ level, index }))
    .filter(({ index }) => {
      const levelNumber = index + 1;
      return levelNumber >= chapter.startLevel && levelNumber <= chapter.endLevel;
    });

  return (
    <main className="page-wrap level-select-page">
      <section className={`glass-panel hero-panel level-select-hero chapter-${chapter.element} card-enter`} style={{ opacity: 0, animationDelay: '0s' }}>
        <div className="page-title-row">
          <div>
            <div className="eyebrow">Chapter {String(chapter.id).padStart(2, '0')} · {chapter.elementLabel}</div>
            <h1>{chapter.name}</h1>
          </div>
          <div className="button-row">
            <div className="metric-pill level-key-pill" style={{ minWidth: 108 }}>
              <span>神奇钥匙</span>
              <strong>{magicKeys}</strong>
            </div>
            <button onClick={onBack} className="action-button">返回章节</button>
          </div>
        </div>
      </section>

      <section className="phigros-level-list">
        {chapterLevels.map(({ level: L, index: i }, displayIndex) => {
          const clearedMax = getMaxStarSync(L.id);
          const hasStarRecord = L.id in allStars;
          const isLocked = (i + 1 > unlocked) && !hasStarRecord;
          const M = MAPS.find(m => m.id === L.mapId);
          const selectedStar = (starSel[i] ?? 1) as 1 | 2 | 3;
          const selectedLabel = STAR_LABELS[selectedStar];
          const levelNumber = i + 1;
          const displayLabel = getChapterLevelLabel(i);
          const ratings = getLevelDifficultyRatings(L.id, levelNumber);
          const hasAt = typeof ratings.AT === 'number';
          const unlockInfos = LEVEL_UNLOCK_REQUIREMENTS.filter(rule => rule.level === levelNumber);
          const progressLabel = isLocked
            ? 'LOCKED'
            : clearedMax > 0
              ? `${STAR_LABELS[clearedMax as 1 | 2 | 3]} CLEAR`
              : 'NO CLEAR';

          return (
            <article
              key={L.id}
              className={`phigros-level-card card-enter ${isLocked ? 'is-locked' : ''}`}
              style={{
                opacity: 0,
                animationDelay: `${0.04 + displayIndex * 0.028}s`,
              }}
            >
              <div className="phigros-level-main">
                <div className="phigros-level-number">{displayLabel}</div>
                <div className="phigros-level-copy">
                  <div className="phigros-level-title">{L.name}</div>
                  <div className="phigros-level-meta">
                    <span>{M ? `MAP ${M.id}` : `MAP ${L.mapId}`}</span>
                    <span>{L.waves.length} WAVES</span>
                    <span>{L.lives} LIVES</span>
                    <span>{progressLabel}</span>
                  </div>
                  {unlockInfos.length > 0 && (
                    <div className="phigros-unlock-row">
                      {unlockInfos.map(info => {
                        const isItemUnlocked = unlockedItemsSet.has(info.itemId);
                        const itemLabel = resolveUnlockItemLabel(info.itemId);
                        const starLabel = STAR_LABELS[info.star];
                        return (
                          <span key={`${info.level}-${info.itemId}`}>
                            {starLabel} CLEAR / {itemLabel}{isItemUnlocked ? ' 已获得' : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="phigros-difficulty-strip" aria-label={`${L.name} difficulty`}>
                {CORE_DIFFICULTIES.map(diff => {
                  const active = selectedStar === diff.star;
                  const cleared = clearedMax >= diff.star;
                  return (
                    <button
                      key={diff.label}
                      type="button"
                      onClick={() => onSelectStar(i, diff.star)}
                      disabled={isLocked}
                      className={`phigros-diff-tile diff-${diff.tone} ${active ? 'is-active' : ''} ${cleared ? 'is-cleared' : ''}`}
                      aria-pressed={active}
                    >
                      <span className="phigros-diff-content">
                        <span className="phigros-diff-rating">{ratings[diff.label]}</span>
                        <span className="phigros-diff-label">{diff.label}</span>
                      </span>
                    </button>
                  );
                })}
                {hasAt && (
                  <button
                    type="button"
                    disabled
                    className="phigros-diff-tile diff-at is-disabled"
                    aria-label={`${L.name} AT difficulty unavailable`}
                  >
                    <span className="phigros-diff-content">
                      <span className="phigros-diff-rating">{ratings.AT}</span>
                      <span className="phigros-diff-label">AT</span>
                    </span>
                  </button>
                )}
              </div>

              <div className="phigros-level-actions">
                <button
                  type="button"
                  onClick={() => onStartLevel(i)}
                  disabled={isLocked}
                  className="phigros-play-button"
                >
                  {isLocked ? 'LOCKED' : `START ${selectedLabel}`}
                </button>
                {isLocked && magicKeys > 0 && (
                  <button
                    type="button"
                    onClick={() => onUnlockLevel(L.id, L.name)}
                    className="phigros-unlock-button"
                  >
                    UNLOCK
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
