import type { StudyData, StudyItem, StudyPhrase, StudyTranslation, StudyWord } from './types';

type RawWord = {
  word?: unknown;
  translations?: unknown;
  phrases?: unknown;
};

let studyDataPromise: Promise<StudyData> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function itemId(kind: StudyItem['kind'], prompt: string) {
  return `${kind}:${prompt.trim().toLocaleLowerCase()}`;
}

function normalizeTranslations(value: unknown): StudyTranslation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(entry => {
    if (!isRecord(entry) || typeof entry.translation !== 'string' || !entry.translation.trim()) return [];
    return [{
      translation: entry.translation.trim(),
      type: typeof entry.type === 'string' && entry.type.trim() ? entry.type.trim() : undefined,
    }];
  });
}

function normalizePhrases(value: unknown): StudyPhrase[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(entry => {
    if (!isRecord(entry) || typeof entry.phrase !== 'string' || typeof entry.translation !== 'string') return [];
    const phrase = entry.phrase.trim();
    const translation = entry.translation.trim();
    return phrase && translation ? [{ phrase, translation }] : [];
  });
}

function formatTranslations(translations: StudyTranslation[]) {
  return translations
    .map(entry => entry.type ? `${entry.type}. ${entry.translation}` : entry.translation)
    .join('；');
}

function parseWordList(raw: string): StudyItem[] {
  const items: StudyItem[] = [];
  raw.split(/\r?\n/).forEach((line, lineIndex) => {
    const divider = line.indexOf('\t');
    if (divider <= 0) return;
    const prompt = line.slice(0, divider).trim();
    const answer = line.slice(divider + 1).trim();
    const id = `w:${lineIndex}`;
    if (!prompt || !answer) return;
    items.push({ id, kind: 'word', prompt, answer });
  });
  return items;
}

function parseJsonWords(raw: unknown): StudyWord[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry: RawWord) => {
    if (!isRecord(entry) || typeof entry.word !== 'string' || !entry.word.trim()) return [];
    const translations = normalizeTranslations(entry.translations);
    return [{
      word: entry.word.trim(),
      translations,
      phrases: normalizePhrases(entry.phrases),
    }];
  });
}

async function fetchText(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return response.text();
}

async function buildStudyData(): Promise<StudyData> {
  const [simpleText, jsonText] = await Promise.all([
    fetchText('/study-data/words.txt'),
    fetchText('/study-data/words.json'),
  ]);
  const browseWords = parseJsonWords(JSON.parse(jsonText) as unknown);
  const wordItems = parseWordList(simpleText);
  const jsonWordItems: StudyItem[] = browseWords.flatMap((word, index) => {
    const answer = formatTranslations(word.translations);
    return answer ? [{ id: `j:${index}`, kind: 'word', prompt: word.word, answer }] : [];
  });
  let phraseIndex = 0;
  const phraseItems: StudyItem[] = browseWords.flatMap(word => word.phrases.map(phrase => ({
    id: `p:${phraseIndex++}`,
    kind: 'phrase' as const,
    prompt: phrase.phrase,
    answer: phrase.translation,
    sourceWord: word.word,
  })));

  const itemById: Record<string, StudyItem> = {};
  [...wordItems, ...jsonWordItems, ...phraseItems].forEach(item => {
    itemById[item.id] ??= item;
  });
  wordItems.forEach((item, index) => {
    itemById[`${itemId('word', item.prompt)}:txt:${index}`] ??= item;
  });
  jsonWordItems.forEach(item => {
    itemById[itemId('word', item.prompt)] ??= item;
  });
  phraseItems.forEach(item => {
    itemById[itemId('phrase', item.prompt)] ??= item;
  });

  return {
    browseWords,
    wordItems,
    jsonWordItems,
    phraseItems,
    mixedItems: [...jsonWordItems, ...phraseItems],
    itemById,
  };
}

export function loadStudyData() {
  studyDataPromise ??= buildStudyData();
  return studyDataPromise;
}
