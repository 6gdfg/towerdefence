import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getToken } from '../td/authProgress';
import AuthBar from '../td/AuthBar';
import { fetchStudyProgress, saveStudyProgressToCloud } from './studyApi';
import { completeDailyPractice, recordBrowseTask } from '../tasks/tasksApi';
import { loadStudyData } from './studyData';
import { DAILY_QUESTION_LIMIT, fromStudyProgressWire, getTodayKey, limitStudyMistakes, loadStudyProgress, mergeStudyProgress, normalizeDailyStats, saveStudyProgress, toStudyProgressWire } from './studyStorage';
import type { MistakeRecord, StudyData, StudyItem, StudyMode, StudyProgress, StudyQuestion } from './types';

type StudyPageProps = {
  onExit: () => void;
};

type AnswerResult = {
  selectedIndex: number;
  correct: boolean;
};

const MODE_OPTIONS: Array<{ id: StudyMode; label: string; short: string }> = [
  { id: 'browse', label: '浏览单词/词组', short: '浏览' },
  { id: 'wordTest', label: '单词测试', short: '单词' },
  { id: 'phraseTest', label: '词组测试', short: '词组' },
  { id: 'daily', label: '每日练习', short: '每日' },
  { id: 'mistakes', label: '错题本', short: '错题' },
  { id: 'mistakeTest', label: '错题测试', short: '复习' },
];

const TEST_MODES = new Set<StudyMode>(['wordTest', 'phraseTest', 'daily', 'mistakeTest']);
const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const MISTAKE_PAGE_SIZE = 18;

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function randomItem(items: StudyItem[], avoidId?: string) {
  if (items.length === 0) return null;
  const candidates = items.length > 1 && avoidId ? items.filter(item => item.id !== avoidId) : items;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? items[0];
}

function buildQuestion(item: StudyItem, distractorPool: StudyItem[]): StudyQuestion {
  const answers = new Set<string>([item.answer]);
  for (const candidate of shuffle(distractorPool)) {
    if (candidate.id === item.id || answers.has(candidate.answer)) continue;
    answers.add(candidate.answer);
    if (answers.size >= 4) break;
  }
  return { item, options: shuffle(Array.from(answers).slice(0, 4)) };
}

function modeTitle(mode: StudyMode) {
  return MODE_OPTIONS.find(option => option.id === mode)?.label ?? '英语学习';
}

export default function StudyPage({ onExit }: StudyPageProps) {
  const [data, setData] = useState<StudyData | null>(null);
  const [loadError, setLoadError] = useState('');
  const [progress, setProgress] = useState<StudyProgress>(() => loadStudyProgress());
  const progressRef = useRef(progress);
  const cloudHydratedRef = useRef(false);
  const cloudSaveTimerRef = useRef<number | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [question, setQuestion] = useState<StudyQuestion | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [sessionAnswered, setSessionAnswered] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [dailySessionActive, setDailySessionActive] = useState(false);
  const [browseQuery, setBrowseQuery] = useState('');
  const [mistakeQuery, setMistakeQuery] = useState('');
  const [mistakePage, setMistakePage] = useState(0);
  const reportedBrowseIndexesRef = useRef(new Set<number>());

  useEffect(() => {
    let cancelled = false;
    loadStudyData()
      .then(result => {
        if (!cancelled) setData(result);
      })
      .catch(error => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : '词库加载失败');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    progressRef.current = progress;
    saveStudyProgress(progress);
    if (!data || !cloudReady || !getToken()) return;
    if (cloudSaveTimerRef.current != null) window.clearTimeout(cloudSaveTimerRef.current);
    cloudSaveTimerRef.current = window.setTimeout(() => {
      cloudSaveTimerRef.current = null;
      void saveStudyProgressToCloud(toStudyProgressWire(progress)).catch(() => undefined);
    }, 900);
  }, [cloudReady, data, progress]);

  useEffect(() => {
    if (!data || cloudHydratedRef.current) return;
    cloudHydratedRef.current = true;
    if (!getToken()) {
      setCloudReady(true);
      return;
    }
    void fetchStudyProgress()
      .then(wire => {
        const cloudProgress = fromStudyProgressWire(wire, data);
        if (cloudProgress) setProgress(current => mergeStudyProgress(current, cloudProgress));
      })
      .catch(() => undefined)
      .finally(() => setCloudReady(true));
  }, [data]);

  useEffect(() => () => {
    if (cloudSaveTimerRef.current != null) window.clearTimeout(cloudSaveTimerRef.current);
  }, []);

  useEffect(() => {
    const save = () => saveStudyProgress(progressRef.current);
    window.addEventListener('beforeunload', save);
    return () => {
      save();
      window.removeEventListener('beforeunload', save);
    };
  }, []);

  const mistakeItems = useMemo(
    () => Object.values(progress.mistakes).sort((a, b) => b.lastWrongAt - a.lastWrongAt),
    [progress.mistakes],
  );

  const createQuestion = useCallback((mode: StudyMode, avoidId?: string) => {
    if (!data) return null;
    if (mode === 'daily' && progress.daily.answered >= DAILY_QUESTION_LIMIT) return null;
    let source: StudyItem[] = [];
    let distractors: StudyItem[] = [];

    if (mode === 'wordTest') {
      source = data.wordItems;
      distractors = data.wordItems;
    } else if (mode === 'phraseTest') {
      source = data.phraseItems;
      distractors = data.phraseItems;
    } else if (mode === 'daily') {
      const useWord = Math.random() < 0.5;
      source = useWord ? data.jsonWordItems : data.phraseItems;
      distractors = data.mixedItems;
    } else if (mode === 'mistakeTest') {
      source = mistakeItems;
      distractors = [...mistakeItems, ...data.mixedItems, ...data.wordItems];
    }

    const item = randomItem(source, avoidId);
    return item ? buildQuestion(item, distractors) : null;
  }, [data, mistakeItems, progress.daily.answered]);

  useEffect(() => {
    if (!data || !TEST_MODES.has(progress.activeMode) || question) return;
    if (progress.activeMode === 'daily' && !dailySessionActive) return;
    setQuestion(createQuestion(progress.activeMode));
  }, [createQuestion, dailySessionActive, data, progress.activeMode, question]);

  const chooseMode = (mode: StudyMode) => {
    setProgress(current => ({ ...current, activeMode: mode, daily: normalizeDailyStats(current.daily) }));
    setQuestion(mode !== 'daily' && TEST_MODES.has(mode) ? createQuestion(mode) : null);
    setAnswerResult(null);
    setSessionAnswered(0);
    setSessionCorrect(0);
    setDailySessionActive(false);
    setMistakePage(0);
  };

  const startDailyPractice = () => {
    const daily = normalizeDailyStats(progress.daily);
    if (daily.answered >= DAILY_QUESTION_LIMIT) {
      setProgress(current => ({ ...current, daily: { date: getTodayKey(), answered: 0, correct: 0 } }));
      setSessionAnswered(0);
      setSessionCorrect(0);
    } else {
      setSessionAnswered(daily.answered);
      setSessionCorrect(daily.correct);
    }
    setQuestion(null);
    setAnswerResult(null);
    setDailySessionActive(true);
  };

  const handleExit = () => {
    saveStudyProgress(progressRef.current);
    if (data && getToken()) {
      void saveStudyProgressToCloud(toStudyProgressWire(progressRef.current)).catch(() => undefined);
    }
    onExit();
  };

  const recordAnswer = (selectedIndex: number) => {
    if (!question || answerResult) return;
    const selectedAnswer = selectedIndex < 4 ? question.options[selectedIndex] : null;
    const correct = selectedAnswer === question.item.answer;
    const mode = progress.activeMode;
    const now = Date.now();
    const normalizedDaily = normalizeDailyStats(progress.daily);
    const completesDailyRound = mode === 'daily' && normalizedDaily.answered + 1 >= DAILY_QUESTION_LIMIT;
    const dailyCorrectAfterAnswer = normalizedDaily.correct + (correct ? 1 : 0);

    setProgress(current => {
      const mistakes = { ...current.mistakes };
      const existing = mistakes[question.item.id];
      if (!correct) {
        mistakes[question.item.id] = {
          ...question.item,
          wrongCount: (existing?.wrongCount ?? 0) + 1,
          correctStreak: 0,
          lastWrongAt: now,
        };
      } else if (mode === 'mistakeTest' && existing) {
        const nextStreak = existing.correctStreak + 1;
        if (nextStreak >= 3) {
          delete mistakes[question.item.id];
        } else {
          mistakes[question.item.id] = { ...existing, correctStreak: nextStreak };
        }
      }

      const currentDaily = normalizeDailyStats(current.daily);
      const daily = mode === 'daily'
        ? {
            ...currentDaily,
            answered: Math.min(DAILY_QUESTION_LIMIT, currentDaily.answered + 1),
            correct: currentDaily.correct + (correct ? 1 : 0),
          }
        : currentDaily;
      return { ...current, mistakes: limitStudyMistakes(mistakes), daily };
    });

    setAnswerResult({ selectedIndex, correct });
    setSessionAnswered(value => value + 1);
    if (correct) setSessionCorrect(value => value + 1);
    if (completesDailyRound && getToken()) {
      void completeDailyPractice(dailyCorrectAfterAnswer).catch(() => undefined);
    }
  };

  const nextQuestion = () => {
    if (progress.activeMode === 'daily' && progress.daily.answered >= DAILY_QUESTION_LIMIT) {
      setQuestion(null);
      setAnswerResult(null);
      setDailySessionActive(false);
      return;
    }
    const next = createQuestion(progress.activeMode, question?.item.id);
    setQuestion(next);
    setAnswerResult(null);
  };

  const browseIndex = data
    ? Math.max(0, Math.min(data.browseWords.length - 1, progress.browseIndex))
    : 0;
  const browseWord = data?.browseWords[browseIndex];

  useEffect(() => {
    if (!data || progress.activeMode !== 'browse' || !getToken()) return;
    if (reportedBrowseIndexesRef.current.has(browseIndex)) return;
    reportedBrowseIndexesRef.current.add(browseIndex);
    void recordBrowseTask(browseIndex).catch(() => {
      reportedBrowseIndexesRef.current.delete(browseIndex);
    });
  }, [browseIndex, data, progress.activeMode]);
  const browseMatches = useMemo(() => {
    if (!data || !browseQuery.trim()) return [];
    const query = browseQuery.trim().toLocaleLowerCase();
    return data.browseWords
      .map((word, index) => ({ word, index }))
      .filter(entry => entry.word.word.toLocaleLowerCase().includes(query)
        || entry.word.phrases.some(phrase => phrase.phrase.toLocaleLowerCase().includes(query)))
      .slice(0, 8);
  }, [browseQuery, data]);

  const setBrowseIndex = (index: number) => {
    if (!data) return;
    const next = Math.max(0, Math.min(data.browseWords.length - 1, index));
    setProgress(current => ({ ...current, browseIndex: next }));
  };

  const filteredMistakes = useMemo(() => {
    const query = mistakeQuery.trim().toLocaleLowerCase();
    return query
      ? mistakeItems.filter(item => item.prompt.toLocaleLowerCase().includes(query) || item.answer.includes(query))
      : mistakeItems;
  }, [mistakeItems, mistakeQuery]);
  const mistakePageCount = Math.max(1, Math.ceil(filteredMistakes.length / MISTAKE_PAGE_SIZE));
  const visibleMistakes = filteredMistakes.slice(
    mistakePage * MISTAKE_PAGE_SIZE,
    (mistakePage + 1) * MISTAKE_PAGE_SIZE,
  );

  useEffect(() => {
    setMistakePage(current => Math.min(current, mistakePageCount - 1));
  }, [mistakePageCount]);

  const renderBrowse = () => {
    if (!browseWord || !data) return null;
    return (
      <div className="study-panel-stack">
        <div className="study-toolbar">
          <div className="study-search-wrap">
            <input
              className="study-search"
              value={browseQuery}
              onChange={event => setBrowseQuery(event.target.value)}
              placeholder="搜索单词或词组"
              aria-label="搜索单词或词组"
            />
            {browseMatches.length > 0 && (
              <div className="study-search-results soft-card">
                {browseMatches.map(entry => (
                  <button
                    key={`${entry.word.word}-${entry.index}`}
                    onClick={() => {
                      setBrowseIndex(entry.index);
                      setBrowseQuery('');
                    }}
                  >
                    <strong>{entry.word.word}</strong>
                    <span>{entry.word.translations[0]?.translation ?? '暂无释义'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="study-page-count">{browseIndex + 1} / {data.browseWords.length}</span>
        </div>

        <article className="soft-card study-word-card">
          <div className="study-word-heading">
            <div>
              <span className="study-kicker">WORD</span>
              <h2>{browseWord.word}</h2>
            </div>
            <span>{browseWord.phrases.length} 个相关词组</span>
          </div>
          <div className="study-translation-list">
            {browseWord.translations.length > 0 ? browseWord.translations.map((entry, index) => (
              <div key={`${entry.type ?? 'meaning'}-${index}`}>
                {entry.type && <span>{entry.type}</span>}
                <p>{entry.translation}</p>
              </div>
            )) : <p className="study-muted">暂无释义</p>}
          </div>
          <div className="study-phrase-list">
            {browseWord.phrases.length > 0 ? browseWord.phrases.map((phrase, index) => (
              <div key={`${phrase.phrase}-${index}`} className="study-phrase-row">
                <strong>{phrase.phrase}</strong>
                <span>{phrase.translation}</span>
              </div>
            )) : <div className="study-empty-inline">暂无相关词组</div>}
          </div>
        </article>

        <div className="study-pagination">
          <button className="action-button" disabled={browseIndex <= 0} onClick={() => setBrowseIndex(browseIndex - 1)}>上一个</button>
          <button className="action-button primary" disabled={browseIndex >= data.browseWords.length - 1} onClick={() => setBrowseIndex(browseIndex + 1)}>下一个</button>
        </div>
      </div>
    );
  };

  const renderTest = () => {
    if (!question) {
      if (progress.activeMode === 'daily') {
        const daily = normalizeDailyStats(progress.daily);
        return (
          <div className="soft-card study-empty-state">
            <strong>{daily.answered >= DAILY_QUESTION_LIMIT ? '本轮练习完成' : '每日练习'}</strong>
            <span>
              {daily.answered >= DAILY_QUESTION_LIMIT
                ? `本轮已完成 ${DAILY_QUESTION_LIMIT} 题，答对 ${daily.correct} 题。`
                : daily.answered > 0
                  ? `本轮已完成 ${daily.answered} / ${DAILY_QUESTION_LIMIT} 题，可继续作答。`
                  : `每轮固定 ${DAILY_QUESTION_LIMIT} 题。`}
            </span>
            <button className="action-button primary" onClick={startDailyPractice}>
              {daily.answered >= DAILY_QUESTION_LIMIT ? '再练一轮' : daily.answered > 0 ? '继续练习' : '开始练习'}
            </button>
          </div>
        );
      }
      return (
        <div className="soft-card study-empty-state">
          <strong>{progress.activeMode === 'mistakeTest' ? '错题本还是空的' : '暂无可用题目'}</strong>
          <span>{progress.activeMode === 'mistakeTest' ? '完成其他测试后，答错或选择“不认识”的题目会出现在这里。' : '请检查词库文件。'}</span>
          {progress.activeMode === 'mistakeTest' && <button className="action-button" onClick={() => chooseMode('wordTest')}>去做单词测试</button>}
        </div>
      );
    }

    return (
      <div className="study-panel-stack">
        <div className="study-test-meta">
          <span>{question.item.kind === 'word' ? '单词' : '词组'}</span>
          {question.item.sourceWord && <span>来源：{question.item.sourceWord}</span>}
          <span>本次 {sessionCorrect} / {sessionAnswered}</span>
          {progress.activeMode === 'daily' && <span>今日 {progress.daily.answered} / {DAILY_QUESTION_LIMIT}</span>}
        </div>
        <article className="soft-card study-question-card">
          <span className="study-kicker">选择正确的中文释义</span>
          <h2>{question.item.prompt}</h2>
          <div className="study-option-list">
            {question.options.map((option, index) => {
              const isCorrectOption = answerResult && option === question.item.answer;
              const isWrongSelection = answerResult && answerResult.selectedIndex === index && !answerResult.correct;
              return (
                <button
                  key={`${option}-${index}`}
                  className={`study-option ${isCorrectOption ? 'is-correct' : ''} ${isWrongSelection ? 'is-wrong' : ''}`}
                  disabled={Boolean(answerResult)}
                  onClick={() => recordAnswer(index)}
                >
                  <span>{OPTION_LABELS[index]}</span>
                  <strong>{option}</strong>
                </button>
              );
            })}
            <button
              className={`study-option is-unknown ${answerResult?.selectedIndex === 4 ? 'is-wrong' : ''}`}
              disabled={Boolean(answerResult)}
              onClick={() => recordAnswer(4)}
            >
              <span>E</span>
              <strong>不认识</strong>
            </button>
          </div>
        </article>

        {answerResult && (
          <div className={`study-answer-panel ${answerResult.correct ? 'is-correct' : 'is-wrong'}`}>
            <div>
              <strong>{answerResult.correct ? '回答正确' : '已加入错题本'}</strong>
              <span>正确释义：{question.item.answer}</span>
              {progress.activeMode === 'mistakeTest' && answerResult.correct && (
                <span>连续答对 3 次后会自动移出错题本。</span>
              )}
            </div>
            <button className="action-button primary" onClick={nextQuestion}>
              {progress.activeMode === 'daily' && progress.daily.answered >= DAILY_QUESTION_LIMIT ? '完成' : '下一题'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderMistakes = () => (
    <div className="study-panel-stack">
      <div className="study-toolbar">
        <input
          className="study-search"
          value={mistakeQuery}
          onChange={event => {
            setMistakeQuery(event.target.value);
            setMistakePage(0);
          }}
          placeholder="搜索错词或释义"
          aria-label="搜索错题"
        />
        <span className="study-page-count">共 {filteredMistakes.length} 题</span>
      </div>
      {visibleMistakes.length > 0 ? (
        <div className="study-mistake-grid">
          {visibleMistakes.map((item: MistakeRecord) => (
            <article key={item.id} className="soft-card study-mistake-card">
              <div className="study-mistake-head">
                <span>{item.kind === 'word' ? '单词' : '词组'}</span>
                <strong>{item.prompt}</strong>
              </div>
              <p>{item.answer}</p>
              <div>
                <span>答错 {item.wrongCount} 次</span>
                <span>连续答对 {item.correctStreak} / 3</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="soft-card study-empty-state">
          <strong>这里暂时没有错题</strong>
          <span>答错或选择“不认识”的单词、词组会自动收录。</span>
        </div>
      )}
      {mistakePageCount > 1 && (
        <div className="study-pagination">
          <button className="action-button" disabled={mistakePage === 0} onClick={() => setMistakePage(page => page - 1)}>上一页</button>
          <span>{mistakePage + 1} / {mistakePageCount}</span>
          <button className="action-button" disabled={mistakePage >= mistakePageCount - 1} onClick={() => setMistakePage(page => page + 1)}>下一页</button>
        </div>
      )}
    </div>
  );

  if (loadError) {
    return (
      <>
        <AuthBar onAuthed={() => window.location.reload()} />
        <main className="study-shell">
        <div className="soft-card study-empty-state">
          <strong>词库加载失败</strong>
          <span>{loadError}</span>
          <button className="action-button" onClick={handleExit}>退出</button>
        </div>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <AuthBar onAuthed={() => window.location.reload()} />
        <main className="study-shell study-loading">
        <strong>STUDY</strong>
        <span>正在整理词库...</span>
        </main>
      </>
    );
  }

  return (
    <>
      <AuthBar onAuthed={() => window.location.reload()} />
      <main className="study-shell">
      <header className="study-header">
        <div>
          <span className="study-kicker">STUDY</span>
          <h1>英语学习</h1>
        </div>
        <div className="study-header-actions">
          <div className="study-summary">
            <div><strong>{data.browseWords.length}</strong><span>单词</span></div>
            <div><strong>{data.phraseItems.length}</strong><span>词组</span></div>
            <div><strong>{mistakeItems.length}</strong><span>错题</span></div>
            <div><strong>{progress.daily.answered}/{DAILY_QUESTION_LIMIT}</strong><span>本轮练习</span></div>
          </div>
        </div>
      </header>

      <div className="study-layout">
        <aside className="soft-card study-sidebar">
          <div className="study-sidebar-title">学习模式</div>
          <nav>
            {MODE_OPTIONS.map(option => (
              <button
                key={option.id}
                className={progress.activeMode === option.id ? 'is-active' : ''}
                onClick={() => chooseMode(option.id)}
              >
                <span>{option.short}</span>
                <strong>{option.label}</strong>
                {option.id === 'mistakes' && mistakeItems.length > 0 && <em>{mistakeItems.length}</em>}
              </button>
            ))}
          </nav>
          <button className="study-exit-button" onClick={handleExit}>退出学习</button>
        </aside>

        <section className="study-content">
          <div className="study-content-title">
            <div>
              <span className="study-kicker">MODE</span>
              <h2>{modeTitle(progress.activeMode)}</h2>
            </div>
          </div>
          {progress.activeMode === 'browse' && renderBrowse()}
          {TEST_MODES.has(progress.activeMode) && renderTest()}
          {progress.activeMode === 'mistakes' && renderMistakes()}
        </section>
      </div>
      </main>
    </>
  );
}
