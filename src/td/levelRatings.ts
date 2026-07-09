import { BALANCE_LAB_LEVEL_DRAFTS } from './balanceDraft.generated';

export type DifficultyCode = 'EZ' | 'HD' | 'IN' | 'AT';
export type LevelDifficultyRatings = Partial<Record<DifficultyCode, number>>;

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

export function createFallbackDifficultyRatings(levelNumber: number): Required<Pick<LevelDifficultyRatings, 'EZ' | 'HD' | 'IN'>> & Partial<Record<'AT', number>> {
  return {
    EZ: Math.min(15, 4 + Math.floor(levelNumber / 3)),
    HD: Math.min(15, 8 + levelNumber),
    IN: Math.min(15, 12 + levelNumber),
  };
}

export function createLabDifficultyRatings(levelId: string, levelNumber: number): Required<Pick<LevelDifficultyRatings, 'EZ' | 'HD' | 'IN'>> & Partial<Record<'AT', number>> {
  return {
    ...createFallbackDifficultyRatings(levelNumber),
    ...GENERATED_LEVEL_DIFFICULTY_RATINGS[levelId],
  };
}

export function getLevelDifficultyRatings(levelId: string, _levelNumber: number): LevelDifficultyRatings {
  return {
    ...GENERATED_LEVEL_DIFFICULTY_RATINGS[levelId],
  };
}
