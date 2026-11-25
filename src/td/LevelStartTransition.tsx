import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import LevelIntro, { type IntroMetadata } from './LevelIntro';
import type { ShapeType } from './types';

export type LevelIntroPhase = 'covering' | 'loading' | 'exiting' | 'revealing';

type Props = {
  metadata: IntroMetadata;
  monsters: ShapeType[];
  ready?: boolean;
  onCovered: () => void;
  onPhaseChange: (phase: LevelIntroPhase) => void;
  onComplete: () => void;
};

export default function LevelStartTransition({ metadata, monsters, ready = true, onCovered, onPhaseChange, onComplete }: Props) {
  const [phase, setPhase] = useState<LevelIntroPhase>('covering');
  const [fontReady, setFontReady] = useState(false);
  const phaseRef = useRef<LevelIntroPhase | 'complete'>('covering');
  const callbacksRef = useRef({ onCovered, onPhaseChange, onComplete });
  useLayoutEffect(() => { callbacksRef.current = { onCovered, onPhaseChange, onComplete }; });

  useEffect(() => {
    let active = true;
    const ready = () => { if (active) setFontReady(true); };
    // A slow font must not hold the player indefinitely; retain system fallback text.
    const timeout = window.setTimeout(ready, 5000);
    document.fonts.load('16px "Tower Defence"', `Chart Illustration admin Loading ${metadata.title} ${metadata.subtitle} ${metadata.contributor} ${metadata.tip}`)
      .catch(() => [])
      .then(() => { window.clearTimeout(timeout); ready(); });
    return () => { active = false; window.clearTimeout(timeout); };
  }, []);

  const advance = useCallback((expected: LevelIntroPhase, next: LevelIntroPhase | 'complete') => {
    if (phaseRef.current !== expected) return;
    phaseRef.current = next;
    if (expected === 'covering') callbacksRef.current.onCovered();
    if (next === 'complete') { callbacksRef.current.onComplete(); return; }
    setPhase(next);
    callbacksRef.current.onPhaseChange(next);
  }, []);

  useEffect(() => {
    if (phase === 'loading' && (!fontReady || !ready)) return;
    // Fallbacks also complete transitions if a browser suppresses animation events.
    const timings = { covering: 700, loading: 1600, exiting: 1550, revealing: 750 };
    const next = { covering: 'loading', loading: 'exiting', exiting: 'revealing', revealing: 'complete' } as const;
    const timer = window.setTimeout(() => advance(phase, next[phase]), timings[phase]);
    return () => window.clearTimeout(timer);
  }, [advance, fontReady, phase, ready]);

  return (
    <div className="level-start-transition" data-phase={phase}>
      <LevelIntro metadata={metadata} monsters={monsters} phase={phase}
        onCoverComplete={() => advance('covering', 'loading')}
        onExitComplete={() => advance('exiting', 'revealing')}
        onRevealComplete={() => advance('revealing', 'complete')}
      />
    </div>
  );
}
