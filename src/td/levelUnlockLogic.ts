import type { LevelSpec } from './levels';
import { getAllStars, getInFullHealthClearSync, getMaxStarSync } from './progress';
import { getLevelDifficultyRatings, type DifficultyCode } from './levelRatings';

export const CORE_DIFFICULTY_STARS: Record<Exclude<DifficultyCode, 'AT'>, 1 | 2 | 3> = {
  EZ: 1,
  HD: 2,
  IN: 3,
};

export function getCoreDifficultyUnlockStar(levels: LevelSpec[], levelIndex: number) {
  const level = levels[levelIndex];
  if (!level) return 0;
  if (levelIndex === 0) return 3;

  const previousLevel = levels[levelIndex - 1];
  const previousMaxStar = previousLevel ? getMaxStarSync(previousLevel.id) : 0;
  const ownMaxStar = getMaxStarSync(level.id);
  const hasOwnProgressRecord = Object.prototype.hasOwnProperty.call(getAllStars(), level.id);

  return Math.max(previousMaxStar, ownMaxStar, hasOwnProgressRecord ? 1 : 0);
}

export function isAtDifficultyUnlocked(levels: LevelSpec[], levelIndex: number) {
  const level = levels[levelIndex];
  if (!level) return false;
  const ratings = getLevelDifficultyRatings(level.id, levelIndex + 1);
  return Boolean(level.difficultyOverrides?.AT && typeof ratings.AT === 'number' && getInFullHealthClearSync(level.id));
}

export function isDifficultyUnlocked(levels: LevelSpec[], levelIndex: number, difficulty: DifficultyCode) {
  if (difficulty === 'AT') {
    return isAtDifficultyUnlocked(levels, levelIndex);
  }
  return CORE_DIFFICULTY_STARS[difficulty] <= getCoreDifficultyUnlockStar(levels, levelIndex);
}

export function getPlayableDifficulty(levels: LevelSpec[], levelIndex: number, preferred: DifficultyCode): DifficultyCode {
  if (isDifficultyUnlocked(levels, levelIndex, preferred)) {
    return preferred;
  }

  const unlockedCoreStar = getCoreDifficultyUnlockStar(levels, levelIndex);
  if (unlockedCoreStar >= 3) return 'IN';
  if (unlockedCoreStar >= 2) return 'HD';
  return 'EZ';
}
