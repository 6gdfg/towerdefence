import { LEVEL_UNLOCK_REQUIREMENTS } from '../../shared/unlocks';
import { STAR_LABELS } from './appConfig';
import { getChapterById, getChapterLevelLabel } from './chapters';
import { getLevelSpecForDifficulty, LEVELS } from './levels';
import { MAPS } from './maps';
import { getAllStars, getMaxStarSync } from './progress';
import { resolveUnlockItemLabel } from './labels';
import { getLevelDifficultyRatings, type DifficultyCode } from './levelRatings';
import type { ChallengeId } from './ChallengeSelectPage';
import { getCoreDifficultyUnlockStar, getPlayableDifficulty, isAtDifficultyUnlocked } from './levelUnlockLogic';

type LevelSelectPageProps = {
  unlocked: number;
  magicKeys: number;
  starSel: Record<number, DifficultyCode>;
  challengeSel: Record<number, ChallengeId[]>;
  unlockedItemsSet: Set<string>;
  chapterId: number;
  onBack: () => void;
  onSelectDifficulty: (levelIndex: number, difficulty: DifficultyCode) => void;
  onToggleChallenge: (levelIndex: number, challenge: ChallengeId) => void;
  onStartLevel: (levelIndex: number, difficulty?: DifficultyCode) => void;
  onUnlockLevel: (levelId: string, levelName: string) => void;
};

const CORE_DIFFICULTIES = [
  { label: 'EZ', star: 1, tone: 'ez' },
  { label: 'HD', star: 2, tone: 'hd' },
  { label: 'IN', star: 3, tone: 'in' },
] as const;

const CHALLENGE_OPTIONS: Array<{ id: ChallengeId; label: string; title: string }> = [
  { id: 'fullHealth', label: '满血', title: '通关时保持本局开局生命，奖励1钻石' },
  { id: 'halfHealth', label: '半血', title: '开局生命减半，通关奖励1钻石' },
];

export default function LevelSelectPage({
  unlocked,
  magicKeys,
  starSel,
  challengeSel,
  unlockedItemsSet,
  chapterId,
  onBack,
  onSelectDifficulty,
  onToggleChallenge,
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
            <div className="eyebrow">Chapter {String(chapter.id).padStart(2, '0')}</div>
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
          const levelNumber = i + 1;
          const displayLabel = getChapterLevelLabel(i);
          const ratings = getLevelDifficultyRatings(L.id, levelNumber);
          const hasAt = Boolean(L.difficultyOverrides?.AT && typeof ratings.AT === 'number');
          const showAt = hasAt && isAtDifficultyUnlocked(LEVELS, i);
          const rawSelectedDifficulty = starSel[i] ?? 'EZ';
          const unlockedCoreStar = getCoreDifficultyUnlockStar(LEVELS, i);
          const selectedDifficulty = getPlayableDifficulty(LEVELS, i, rawSelectedDifficulty);
          const selectedChallenges = challengeSel[i] ?? [];
          const selectedLevel = getLevelSpecForDifficulty(L, selectedDifficulty);
          const M = MAPS.find(m => m.id === selectedLevel.mapId);
          const selectedLabel = selectedDifficulty;
          const unlockInfos = LEVEL_UNLOCK_REQUIREMENTS.filter(rule => rule.level === levelNumber && (rule.difficulty !== 'AT' || showAt));
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
                    <span>{M ? `MAP ${M.id}` : `MAP ${selectedLevel.mapId}`}</span>
                    <span>{selectedLevel.waves.length} WAVES</span>
                    <span>{selectedLevel.lives} LIVES</span>
                    <span>{progressLabel}</span>
                  </div>
                  {unlockInfos.length > 0 && (
                    <div className="phigros-unlock-row">
                      {unlockInfos.map(info => {
                        const isItemUnlocked = unlockedItemsSet.has(info.itemId);
                        const itemLabel = resolveUnlockItemLabel(info.itemId);
                        return (
                          <span key={`${info.level}-${info.difficulty}-${info.itemId}`}>
                            通关{info.difficulty}可获得{itemLabel}{isItemUnlocked ? ' 已获得' : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="phigros-difficulty-strip" aria-label={`${L.name} difficulty`}>
                {CORE_DIFFICULTIES.map(diff => {
                  const active = selectedDifficulty === diff.label;
                  const cleared = clearedMax >= diff.star;
                  const difficultyLocked = diff.star > unlockedCoreStar;
                  return (
                    <button
                      key={diff.label}
                      type="button"
                      onClick={() => onSelectDifficulty(i, diff.label)}
                      disabled={isLocked || difficultyLocked}
                      className={`phigros-diff-tile diff-${diff.tone} ${active ? 'is-active' : ''} ${cleared ? 'is-cleared' : ''} ${difficultyLocked ? 'is-locked' : ''}`}
                      aria-pressed={active}
                      title={difficultyLocked ? '通关上一关对应或更高难度后解锁' : undefined}
                    >
                      <span className="phigros-diff-content">
                        <span className="phigros-diff-rating">{ratings[diff.label]}</span>
                        <span className="phigros-diff-label">{diff.label}</span>
                      </span>
                    </button>
                  );
                })}
                {showAt && (
                  <button
                    type="button"
                    onClick={() => onSelectDifficulty(i, 'AT')}
                    disabled={isLocked}
                    className={`phigros-diff-tile diff-at ${selectedDifficulty === 'AT' ? 'is-active' : ''}`}
                    aria-pressed={selectedDifficulty === 'AT'}
                  >
                    <span className="phigros-diff-content">
                      <span className="phigros-diff-rating">{ratings.AT}</span>
                      <span className="phigros-diff-label">AT</span>
                    </span>
                  </button>
                )}
              </div>

              <div className="phigros-level-actions">
                <div className="phigros-challenge-row" aria-label={`${L.name} challenge`}>
                  {CHALLENGE_OPTIONS.map(challenge => {
                    const active = selectedChallenges.includes(challenge.id);
                    return (
                      <button
                        key={challenge.id}
                        type="button"
                        onClick={() => onToggleChallenge(i, challenge.id)}
                        disabled={isLocked}
                        title={challenge.title}
                        className={`phigros-challenge-chip ${active ? 'is-active' : ''}`}
                        aria-pressed={active}
                      >
                        {challenge.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => onStartLevel(i, selectedDifficulty)}
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
