export type StudyMode = 'browse' | 'wordTest' | 'phraseTest' | 'daily' | 'mistakes' | 'mistakeTest';
export type StudyItemKind = 'word' | 'phrase';

export type StudyTranslation = {
  translation: string;
  type?: string;
};

export type StudyPhrase = {
  phrase: string;
  translation: string;
};

export type StudyWord = {
  word: string;
  translations: StudyTranslation[];
  phrases: StudyPhrase[];
};

export type StudyItem = {
  id: string;
  kind: StudyItemKind;
  prompt: string;
  answer: string;
  sourceWord?: string;
};

export type StudyData = {
  browseWords: StudyWord[];
  wordItems: StudyItem[];
  jsonWordItems: StudyItem[];
  phraseItems: StudyItem[];
  mixedItems: StudyItem[];
  itemById: Record<string, StudyItem>;
};

export type MistakeRecord = StudyItem & {
  wrongCount: number;
  correctStreak: number;
  lastWrongAt: number;
};

export type DailyStudyStats = {
  date: string;
  answered: number;
  correct: number;
};

export type StudyProgress = {
  activeMode: StudyMode;
  browseIndex: number;
  mistakes: Record<string, MistakeRecord>;
  daily: DailyStudyStats;
};

export type StudyProgressWire = {
  v: 1;
  m: StudyMode;
  b: number;
  d: [string, number, number];
  x: Array<[string, number, number, number]>;
};

export type StudyQuestion = {
  item: StudyItem;
  options: string[];
};
