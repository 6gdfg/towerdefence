import { BALANCE_LAB_LEVEL_DRAFTS } from './balanceDraft.generated';

export type DifficultyCode = 'EZ' | 'HD' | 'IN' | 'AT';
export type LevelDifficultyRatings = Record<'EZ' | 'HD' | 'IN', number> & Partial<Record<'AT', number>>;

const BASE_LEVEL_DIFFICULTY_RATINGS: Record<string, LevelDifficultyRatings> = {
  L1: { EZ: 1, HD: 4, IN: 13 },
  L2: { EZ: 4, HD: 10, IN: 14 },
  L3: { EZ: 5, HD: 11, IN: 15, AT: 16 },
};

function buildGeneratedDifficultyRatings() {
  const ratings: Record<string, Partial<Record<DifficultyCode, number>>> = {};
  BALANCE_LAB_LEVEL_DRAFTS.forEach(draft => {
    ratings[draft.sourceLevelId] = {
      ...ratings[draft.sourceLevelId],
      [draft.difficulty]: draft.rating,
    };
  });
  return ratings;
}

export const GENERATED_LEVEL_DIFFICULTY_RATINGS = buildGeneratedDifficultyRatings();
export const LEVEL_DIFFICULTY_RATINGS: Record<string, LevelDifficultyRatings> = BASE_LEVEL_DIFFICULTY_RATINGS;

export function createFallbackDifficultyRatings(levelNumber: number): LevelDifficultyRatings {
  return {
    EZ: Math.min(15, 4 + Math.floor(levelNumber / 3)),
    HD: Math.min(15, 8 + levelNumber),
    IN: Math.min(15, 12 + levelNumber),
  };
}

export function getLevelDifficultyRatings(levelId: string, levelNumber: number): LevelDifficultyRatings {
  return {
    ...(LEVEL_DIFFICULTY_RATINGS[levelId] ?? createFallbackDifficultyRatings(levelNumber)),
    ...GENERATED_LEVEL_DIFFICULTY_RATINGS[levelId],
  };
}
