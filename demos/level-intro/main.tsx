import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import TDGame from '../../src/td/TDGame';
import { BALANCE_LAB_LEVEL_DRAFTS } from '../../src/td/balanceDraft.generated';
import { getChapterLevelLabel } from '../../src/td/chapters';
import { MAPS, getPlantGrid } from '../../src/td/maps';
import { PLANT_TYPES, ELEMENT_TYPES } from '../../src/td/appConfig';
import { hasWonLevel, useTDStore } from '../../src/td/store';
import { useGameViewport } from '../../src/td/useGameViewport';
import type { BalanceLabLevelDraft } from '../../src/td/BalanceLabPage';
import type { TowerLevelMap } from '../../src/td/types';
import LevelIntro, { type IntroMetadata } from './LevelIntro';
import { INTRO_TIPS } from './tips';
import { getIntroMonsters } from './introLayout';
import '../../src/index.css';
import '../../src/styles/game-font.css';
import './demo.css';

type Phase = 'loading' | 'exiting' | 'revealing' | 'playing';
type PreviewSettings = IntroMetadata & { draftKey: string; holdSeconds: number };

const drafts = BALANCE_LAB_LEVEL_DRAFTS.filter(draft => draft.levelNumber <= 16);
const draftKey = (draft: BalanceLabLevelDraft) => `${draft.sourceLevelId}:${draft.difficulty}`;
const initialDraft = drafts.find(draft => draftKey(draft) === 'L15:AT') ?? drafts[0];

function settingsFor(draft: BalanceLabLevelDraft): PreviewSettings {
  const name = getChapterLevelLabel(draft.levelNumber - 1);
  return {
    draftKey: draftKey(draft), title: name, subtitle: name,
    contributor: draft.contributor?.trim() || 'admin', difficulty: draft.difficulty, rating: draft.rating,
    tip: INTRO_TIPS[0], holdSeconds: 3,
  };
}

function preparePreview(draft: BalanceLabLevelDraft) {
  const map = MAPS.find(map => map.id === draft.mapId);
  if (!map) throw new Error(`Missing preview map: ${draft.mapId}`);
  const towerLevels = Object.fromEntries([
    ...PLANT_TYPES.map(plant => [plant, 10]),
    ...ELEMENT_TYPES.map(element => [`element:${element}`, 10]),
  ]) as TowerLevelMap;
  useTDStore.getState().loadLevel({
    startGold: draft.startGold, lives: draft.lives,
    waves: draft.waves.map(wave => ({ groups: wave.groups.map(group => ({ ...group })) })),
  }, { ...map, plantGrid: getPlantGrid(map) }, {
    mode: 'lab', towerLevels, allowedPlants: PLANT_TYPES, allowedElements: ELEMENT_TYPES,
    autoStartFirstWave: draft.autoStartFirstWave, firstWaveDelaySec: draft.firstWaveDelaySec,
    atModeConfig: draft.difficulty === 'AT' ? draft.atModeConfig : null,
    specialEnemyConfig: draft.specialEnemyConfig,
  });
  useTDStore.setState({ running: false });
}

function DemoApp() {
  const [settings, setSettings] = useState(() => settingsFor(initialDraft));
  const [editor, setEditor] = useState(settings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [run, setRun] = useState(0);
  const [fontReady, setFontReady] = useState(false);
  const startedRef = useRef(false);
  const settingsWasRunningRef = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewport = useGameViewport();
  const portraitBlocked = viewport.isPhone && viewport.isPortrait;
  const selectedDraft = drafts.find(draft => draftKey(draft) === settings.draftKey) ?? initialDraft;

  useEffect(() => {
    let active = true;
    // Keep the wipe running while the font loads; never block on a failed font request.
    document.fonts.load('16px "Tower Defence"', 'Chart Illustration admin 不要忘记元素可以单独放置！')
      .catch(() => [])
      .then(() => { if (active) setFontReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    preparePreview(selectedDraft);
    startedRef.current = false;
    setPhase('loading');
    if (!fontReady) return;
    const timer = window.setTimeout(() => setPhase('exiting'), settings.holdSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [run, selectedDraft, settings.holdSeconds, fontReady]);

  useEffect(() => {
    if (phase !== 'playing' || portraitBlocked || startedRef.current) return;
    startedRef.current = true;
    useTDStore.setState({ running: true });
  }, [phase, portraitBlocked]);

  useEffect(() => {
    if (settingsOpen && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [settingsOpen]);

  const replay = (next = settings) => {
    useTDStore.setState({ running: false });
    setSettings(next);
    setSettingsOpen(false);
    setPhase('loading');
    setRun(current => current + 1);
  };

  const openSettings = () => {
    settingsWasRunningRef.current = useTDStore.getState().running;
    useTDStore.setState({ running: false });
    setEditor(settings);
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
    const state = useTDStore.getState();
    if (settingsWasRunningRef.current && !portraitBlocked && state.lives > 0 && !hasWonLevel(state)) useTDStore.setState({ running: true });
  };

  return (
    <main className="intro-demo-app" data-phase={phase}>
      {(phase === 'revealing' || phase === 'playing') && (
        <div className={`intro-demo-game ${phase === 'revealing' ? 'is-revealing' : ''}`} {...(phase === 'revealing' ? { inert: '' } : {})}>
          <TDGame key={run} difficultyLabel={`${settings.difficulty} Lv.${settings.rating}`} onExit={() => replay()} />
        </div>
      )}
      {phase !== 'playing' && (
        <LevelIntro
          key={run} metadata={settings} monsters={getIntroMonsters(selectedDraft.waves)} phase={phase}
          onExitComplete={() => setPhase('revealing')}
          onRevealComplete={() => setPhase('playing')}
        />
      )}

      {phase === 'playing' && !portraitBlocked && (
        <div className="intro-demo-tools">
          <button type="button" title="重播启动动画" aria-label="重播启动动画" onClick={() => replay()}><RotateCcw size={20} /></button>
          <button type="button" title="预览设置" aria-label="预览设置" onClick={openSettings}><SlidersHorizontal size={20} /></button>
        </div>
      )}

      {settingsOpen && (
        <dialog ref={dialogRef} className="intro-demo-settings" aria-labelledby="intro-settings-title" onCancel={event => { event.preventDefault(); closeSettings(); }}>
          <form onSubmit={event => { event.preventDefault(); replay(editor); }}>
            <header><h2 id="intro-settings-title">预览设置</h2><button type="button" title="关闭" aria-label="关闭" onClick={closeSettings}><X size={20} /></button></header>
            <label>关卡
              <select aria-label="关卡" value={editor.draftKey} onChange={event => {
                const draft = drafts.find(draft => draftKey(draft) === event.target.value);
                if (draft) setEditor({ ...settingsFor(draft), holdSeconds: editor.holdSeconds });
              }}>
                {drafts.map(draft => <option key={draftKey(draft)} value={draftKey(draft)}>{getChapterLevelLabel(draft.levelNumber - 1)} · {draft.difficulty} Lv.{draft.rating}</option>)}
              </select>
            </label>
            <div className="intro-demo-fields">
              <label>主关卡名<input value={editor.title} maxLength={60} required onChange={event => setEditor({ ...editor, title: event.target.value })} /></label>
              <label>副关卡名<input value={editor.subtitle} maxLength={80} required onChange={event => setEditor({ ...editor, subtitle: event.target.value })} /></label>
            </div>
            <label>Chart<input value={editor.contributor} maxLength={80} placeholder="admin" onChange={event => setEditor({ ...editor, contributor: event.target.value })} /></label>
            <label>Tip<input value={editor.tip} list="intro-tip-options" maxLength={120} onChange={event => setEditor({ ...editor, tip: event.target.value })} /></label>
            <datalist id="intro-tip-options">{INTRO_TIPS.map(tip => <option key={tip} value={tip} />)}</datalist>
            <label className="intro-demo-duration">停留时间 <output>{editor.holdSeconds.toFixed(1)}s</output><input type="range" min="1" max="6" step="0.2" value={editor.holdSeconds} onChange={event => setEditor({ ...editor, holdSeconds: Number(event.target.value) })} /></label>
            <footer><button type="submit"><Play size={16} />播放</button></footer>
          </form>
        </dialog>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><DemoApp /></StrictMode>);
