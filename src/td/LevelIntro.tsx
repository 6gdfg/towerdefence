import { useLayoutEffect, useRef, useState } from 'react';
import type { DifficultyCode } from './levelRatings';
import type { ShapeType } from './types';
import { MONSTER_LABELS } from './appConfig';
import { MonsterIcon } from './TowerIcons';
import { fitIntroScale, INTRO_HEIGHT, INTRO_WIDTH } from './introLayout';
import './LevelIntro.css';

export type IntroMetadata = {
  title: string;
  subtitle: string;
  contributor: string;
  difficulty: DifficultyCode;
  rating: number;
  tip: string;
};

type LevelIntroProps = {
  metadata: IntroMetadata;
  monsters: ShapeType[];
  phase: 'covering' | 'loading' | 'exiting' | 'revealing';
  onCoverComplete?: () => void;
  onExitComplete: () => void;
  onRevealComplete: () => void;
};

export default function LevelIntro({ metadata, monsters, phase, onCoverComplete, onExitComplete, onRevealComplete }: LevelIntroProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const resize = () => {
      const rect = viewport.getBoundingClientRect();
      setScale(fitIntroScale(rect.width, rect.height));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className={`level-intro phase-${phase}`}
      aria-label="关卡启动界面"
      onAnimationEnd={event => {
        if (event.target === event.currentTarget && (event.animationName === 'intro-cover-enter' || event.animationName === 'intro-cover-fade')) onCoverComplete?.();
        if (event.target === event.currentTarget && event.animationName === 'intro-backdrop-fade') onRevealComplete();
      }}
    >
      <div ref={viewportRef} className="intro-viewport">
      <div className="intro-canvas" style={{ width: INTRO_WIDTH, height: INTRO_HEIGHT, transform: `translate(-50%, -50%) scale(${scale})` }}>
      <div
        className="intro-composition"
        onAnimationEnd={event => {
          if (event.target === event.currentTarget && (event.animationName === 'intro-composition-exit' || event.animationName === 'intro-composition-fade')) onExitComplete();
        }}
      >
        <div className="intro-title-strip">
          <div className="intro-title-copy">
            <h1 title={metadata.title}>{metadata.title}</h1>
            <p title={metadata.subtitle}>{metadata.subtitle}</p>
          </div>
          <div className={`intro-difficulty intro-difficulty-${metadata.difficulty.toLowerCase()}`}>
            <span className={`intro-rating${String(metadata.rating).length > 2 ? ' intro-rating-wide' : ''}`}>{metadata.rating}</span>
            <span className="intro-difficulty-label">{metadata.difficulty}</span>
          </div>
        </div>

        <div className="intro-credit">
          <div className="intro-chart">
            <span>Chart</span>
            <p title={metadata.contributor}>{metadata.contributor.trim() || 'admin'}</p>
          </div>
          <div className="intro-illustration">
            <span>Illustration</span>
            <p>admin</p>
          </div>
        </div>

        <div className="intro-cover" aria-label={monsters.length ? '本关怪物' : '空白曲绘'}>
          {monsters.length > 0 && (
            <div className="intro-monster-grid" role="list" aria-label="本关怪物列表">
              {[0, 1, 2].map(row => (
                <div key={row} className="intro-monster-row" role="presentation">
                  {monsters.slice(row * 4, row * 4 + 4).map(monster => (
                    <div key={monster} className="intro-monster" role="listitem" data-monster={monster}>
                      <MonsterIcon type={monster} size={52} color="#f7f7f8" />
                      <span title={MONSTER_LABELS[monster]}>{MONSTER_LABELS[monster]}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="intro-tip" title={metadata.tip}>Tip: {metadata.tip}</p>
        <div className="intro-loading" role="status" aria-label="Loading...">
          <span className="intro-loading-label" aria-hidden="true">Loading...</span>
          <span className="intro-loading-wipe" aria-hidden="true">Loading...</span>
        </div>
      </div>
      </div>
      </div>
    </section>
  );
}
