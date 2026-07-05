import type { ElementType } from './types';

export const CHAPTER_SIZE = 10;

export type ChapterSpec = {
  id: number;
  name: string;
  element: ElementType;
  elementLabel: string;
  startLevel: number;
  endLevel: number;
};

export const CHAPTERS: ChapterSpec[] = [
  { id: 1, name: '火之晨曦', element: 'fire', elementLabel: '火元素', startLevel: 1, endLevel: 10 },
  { id: 2, name: '疾风凌云', element: 'wind', elementLabel: '风元素', startLevel: 11, endLevel: 20 },
  { id: 3, name: '金戈铁马', element: 'gold', elementLabel: '金元素', startLevel: 21, endLevel: 30 },
  { id: 4, name: '冰封万里', element: 'ice', elementLabel: '冰元素', startLevel: 31, endLevel: 40 },
  { id: 5, name: '紫电清霜', element: 'electric', elementLabel: '电元素', startLevel: 41, endLevel: 50 },
  { id: 6, name: '圣光普照', element: 'light', elementLabel: '光元素', startLevel: 51, endLevel: 60 },
];

export function getChapterById(chapterId: number) {
  return CHAPTERS.find(chapter => chapter.id === chapterId) ?? CHAPTERS[0];
}

export function getChapterForLevelNumber(levelNumber: number) {
  return CHAPTERS.find(chapter => levelNumber >= chapter.startLevel && levelNumber <= chapter.endLevel) ?? CHAPTERS[0];
}

export function getChapterForLevelIndex(levelIndex: number) {
  return getChapterForLevelNumber(levelIndex + 1);
}

export function getChapterLevelLabel(levelIndex: number) {
  const levelNumber = levelIndex + 1;
  const chapter = getChapterForLevelNumber(levelNumber);
  const localNumber = Math.max(1, levelNumber - chapter.startLevel + 1);
  return `${chapter.id}-${localNumber}`;
}
