import { CHAPTERS } from './chapters';
import { getAllStars } from './progress';

type ChapterSelectPageProps = {
  unlocked: number;
  onBack: () => void;
  onSelectChapter: (chapterId: number) => void;
};

export default function ChapterSelectPage({ unlocked, onBack, onSelectChapter }: ChapterSelectPageProps) {
  const allStars = getAllStars();

  return (
    <main className="page-wrap chapter-select-page">
      <section className="glass-panel hero-panel chapter-hero card-enter" style={{ opacity: 0, animationDelay: '0s' }}>
        <div className="page-title-row">
          <div>
            <div className="eyebrow">Main Story</div>
            <h1>章节选择</h1>
            <p>每个章节包含 10 个主线关卡。</p>
          </div>
          <button onClick={onBack} className="action-button">返回主界面</button>
        </div>
      </section>

      <section className="chapter-grid">
        {CHAPTERS.map((chapter, index) => {
          const chapterLevelNumbers = Array.from({ length: chapter.endLevel - chapter.startLevel + 1 }, (_, offset) => chapter.startLevel + offset);
          const hasUnlockedLevel = chapterLevelNumbers.some(levelNumber => `L${levelNumber}` in allStars);
          const isLocked = chapter.startLevel > unlocked && !hasUnlockedLevel;
          const completed = chapterLevelNumbers.filter(levelNumber => (allStars[`L${levelNumber}`] ?? 0) > 0).length;

          return (
            <button
              key={chapter.id}
              type="button"
              disabled={isLocked}
              onClick={() => onSelectChapter(chapter.id)}
              className={`chapter-card chapter-${chapter.element} ${isLocked ? 'is-locked' : ''} card-enter`}
              style={{ opacity: 0, animationDelay: `${0.06 + index * 0.045}s` }}
            >
              <span className="chapter-index">Chapter {String(chapter.id).padStart(2, '0')}</span>
              <strong>{chapter.name}</strong>
              <span className="chapter-range">{chapter.id}-1 至 {chapter.id}-10</span>
              <span className="chapter-progress">
                {isLocked ? `通关 ${chapter.startLevel - 1} 解锁` : `${completed} / 10 CLEAR`}
              </span>
            </button>
          );
        })}
      </section>
    </main>
  );
}
