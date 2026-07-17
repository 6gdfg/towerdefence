import type { DailyStudyStats, MistakeRecord, StudyData, StudyProgress, StudyProgressWire } from './types';

const STUDY_PROGRESS_KEY = 'tower-defence-study-progress-v1';
const STUDY_MODES = new Set(['browse', 'wordTest', 'phraseTest', 'daily', 'mistakes', 'mistakeTest']);
export const DAILY_QUESTION_LIMIT = 50;

export function getTodayKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const read = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return `${read('year')}-${read('month')}-${read('day')}`;
}

function freshDaily(): DailyStudyStats {
  return { date: getTodayKey(), answered: 0, correct: 0 };
}

export function normalizeDailyStats(daily?: Partial<DailyStudyStats>): DailyStudyStats {
  if (daily?.date !== getTodayKey()) return freshDaily();
  const answered = Math.max(0, Math.min(DAILY_QUESTION_LIMIT, Math.floor(daily.answered ?? 0)));
  return {
    date: getTodayKey(),
    answered,
    correct: Math.max(0, Math.min(answered, Math.floor(daily.correct ?? 0))),
  };
}

export function createDefaultStudyProgress(): StudyProgress {
  return {
    activeMode: 'browse',
    browseIndex: 0,
    mistakes: {},
    daily: freshDaily(),
  };
}

export function loadStudyProgress(): StudyProgress {
  const fallback = createDefaultStudyProgress();
  try {
    const raw = window.localStorage.getItem(STUDY_PROGRESS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StudyProgress>;
    const daily = normalizeDailyStats(parsed.daily);
    return {
      activeMode: parsed.activeMode && STUDY_MODES.has(parsed.activeMode) ? parsed.activeMode : fallback.activeMode,
      browseIndex: Math.max(0, Math.floor(parsed.browseIndex ?? 0)),
      mistakes: parsed.mistakes && typeof parsed.mistakes === 'object' ? parsed.mistakes : {},
      daily,
    };
  } catch {
    return fallback;
  }
}

export function saveStudyProgress(progress: StudyProgress) {
  window.localStorage.setItem(STUDY_PROGRESS_KEY, JSON.stringify(progress));
}

export function toStudyProgressWire(progress: StudyProgress): StudyProgressWire {
  const daily = normalizeDailyStats(progress.daily);
  return {
    v: 1,
    m: progress.activeMode,
    b: Math.max(0, Math.floor(progress.browseIndex)),
    d: [daily.date, daily.answered, daily.correct],
    x: Object.values(progress.mistakes).map(mistake => [
      mistake.id,
      Math.max(1, Math.floor(mistake.wrongCount)),
      Math.max(0, Math.min(2, Math.floor(mistake.correctStreak))),
      Math.max(0, Math.floor(mistake.lastWrongAt)),
    ]),
  };
}

export function fromStudyProgressWire(wire: StudyProgressWire | null | undefined, data: StudyData): StudyProgress | null {
  if (!wire || wire.v !== 1 || !STUDY_MODES.has(wire.m)) return null;
  const mistakes: Record<string, MistakeRecord> = {};
  wire.x.forEach(([id, wrongCount, correctStreak, lastWrongAt]) => {
    const item = data.itemById[id];
    if (!item) return;
    mistakes[id] = {
      ...item,
      wrongCount: Math.max(1, Math.floor(wrongCount)),
      correctStreak: Math.max(0, Math.min(2, Math.floor(correctStreak))),
      lastWrongAt: Math.max(0, Math.floor(lastWrongAt)),
    };
  });
  return {
    activeMode: wire.m,
    browseIndex: Math.max(0, Math.floor(wire.b)),
    mistakes,
    daily: normalizeDailyStats({ date: wire.d[0], answered: wire.d[1], correct: wire.d[2] }),
  };
}

export function mergeStudyProgress(local: StudyProgress, cloud: StudyProgress): StudyProgress {
  const mistakes: Record<string, MistakeRecord> = { ...cloud.mistakes };
  Object.values(local.mistakes).forEach(localMistake => {
    const cloudMistake = mistakes[localMistake.id];
    if (!cloudMistake) {
      mistakes[localMistake.id] = localMistake;
      return;
    }
    const latest = localMistake.lastWrongAt >= cloudMistake.lastWrongAt ? localMistake : cloudMistake;
    mistakes[localMistake.id] = {
      ...latest,
      wrongCount: Math.max(localMistake.wrongCount, cloudMistake.wrongCount),
      correctStreak: latest.correctStreak,
    };
  });

  const localDaily = normalizeDailyStats(local.daily);
  const cloudDaily = normalizeDailyStats(cloud.daily);
  const daily = localDaily.answered >= cloudDaily.answered ? localDaily : cloudDaily;
  const localHasProgress = local.browseIndex > 0 || Object.keys(local.mistakes).length > 0 || localDaily.answered > 0 || local.activeMode !== 'browse';
  const primary = localHasProgress ? local : cloud;

  return {
    activeMode: primary.activeMode,
    browseIndex: primary.browseIndex,
    mistakes,
    daily,
  };
}
