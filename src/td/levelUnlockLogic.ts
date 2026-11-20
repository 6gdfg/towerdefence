import { getConfiguredDifficulties, hasLevelDifficultyDraft, type LevelSpec } from './levels';
import { getAllStars, getInFullHealthClearSync, getMaxStarSync } from './progress';
import { getLevelDifficultyRatings, type DifficultyCode } from './levelRatings';

export const CORE_DIFFICULTY_STARS: Record<Exclude<DifficultyCode, 'AT'>, 1 | 2 | 3> = {
  EZ: 1,
  HD: 2,
  IN: 3,
};

export function getCoreDifficultyUnlockStar(levels: LevelSpec[], levelIndex: number, localPlaytest = false) {
  const level = levels[levelIndex];
  if (!level) return 0;
  if (import.meta.env?.DEV && localPlaytest) return 3;
  if (levelIndex === 0) return 3;

  const previousLevel = levels[levelIndex - 1];
  const previousMaxStar = previousLevel ? getMaxStarSync(previousLevel.id) : 0;
  const ownMaxStar = getMaxStarSync(level.id);
  const hasOwnProgressRecord = Object.prototype.hasOwnProperty.call(getAllStars(), level.id);
  const ownProgressUnlockStar = ownMaxStar > 0 ? Math.min(3, ownMaxStar + 1) : 0;

  return Math.max(previousMaxStar, ownProgressUnlockStar, hasOwnProgressRecord ? 1 : 0);
}

export function isAtDifficultyUnlocked(levels: LevelSpec[], levelIndex: number, localPlaytest = false) {
  const level = levels[levelIndex];
  if (!level) return false;
  const ratings = getLevelDifficultyRatings(level.id, levelIndex + 1);
  return Boolean(hasLevelDifficultyDraft(level, 'AT') && typeof ratings.AT === 'number'
    && ((import.meta.env?.DEV && localPlaytest) || getInFullHealthClearSync(level.id)));
}

export function isDifficultyUnlocked(levels: LevelSpec[], levelIndex: number, difficulty: DifficultyCode, localPlaytest = false) {
  const level = levels[levelIndex];
  if (!hasLevelDifficultyDraft(level, difficulty)) return false;
  if (difficulty === 'AT') {
    return isAtDifficultyUnlocked(levels, levelIndex, localPlaytest);
  }
  return CORE_DIFFICULTY_STARS[difficulty] <= getCoreDifficultyUnlockStar(levels, levelIndex, localPlaytest);
}

export function getPlayableDifficulty(levels: LevelSpec[], levelIndex: number, preferred: DifficultyCode, localPlaytest = false): DifficultyCode {
  if (isDifficultyUnlocked(levels, levelIndex, preferred, localPlaytest)) {
    return preferred;
  }

  const level = levels[levelIndex];
  const configured = getConfiguredDifficulties(level);
  const unlockedConfigured = configured.filter(difficulty => isDifficultyUnlocked(levels, levelIndex, difficulty, localPlaytest));
  if (unlockedConfigured.includes('IN')) return 'IN';
  if (unlockedConfigured.includes('HD')) return 'HD';
  if (unlockedConfigured.includes('EZ')) return 'EZ';
  if (unlockedConfigured.includes('AT')) return 'AT';
  return 'EZ';
}
