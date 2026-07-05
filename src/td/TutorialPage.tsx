import { useState } from 'react';
import { BASE_PLANTS_CONFIG } from './plants';

type TutorialPlant = 'sunflower' | 'bottleGrass';
type TutorialStep = 0 | 1 | 2 | 3 | 4 | 5;

type TutorialPageProps = {
  onComplete: () => void;
};

const STEP_COPY: Record<TutorialStep, { eyebrow: string; title: string; body: string }> = {
  0: {
    eyebrow: '第一步',
    title: '选择向日葵',
    body: '先从下方选择向日葵。它是起手资源植物，适合先放在道路旁边的空地。',
  },
  1: {
    eyebrow: '第二步',
    title: '点击发光格子',
    body: '把向日葵种到发光的位置。正式关卡里，植物只能放在可种植点上，怪物会沿着白色道路前进。',
  },
  2: {
    eyebrow: '第三步',
    title: '选择瓶子草',
    body: '接着选择瓶子草。它是初始攻击植物，负责在怪物经过时输出伤害。',
  },
  3: {
    eyebrow: '第四步',
    title: '补上攻击植物',
    body: '把瓶子草放在第二个发光格子，尽量覆盖道路拐角，让攻击时间更长。',
  },
  4: {
    eyebrow: '第五步',
    title: '启动怪物波次',
    body: '阵型摆好后启动波次。金币、生命和波次会显示在战斗顶部，打完全部波次即可结算。',
  },
  5: {
    eyebrow: '完成',
    title: '可以正式开打了',
    body: '一星、二星、三星会影响怪物等级和奖励。首次通关必给对应宝箱，重复刷关金币减半，宝箱改为概率掉落。',
  },
};

const PLOTS: Record<TutorialPlant, { x: number; y: number }> = {
  sunflower: { x: 210, y: 226 },
  bottleGrass: { x: 390, y: 134 },
};

const PLANT_BUTTONS: Array<{ id: TutorialPlant; role: string }> = [
  { id: 'sunflower', role: '资源' },
  { id: 'bottleGrass', role: '攻击' },
];

export default function TutorialPage({ onComplete }: TutorialPageProps) {
  const [step, setStep] = useState<TutorialStep>(0);
  const [selectedPlant, setSelectedPlant] = useState<TutorialPlant | null>(null);
  const [placed, setPlaced] = useState<Record<TutorialPlant, boolean>>({
    sunflower: false,
    bottleGrass: false,
  });

  const current = STEP_COPY[step];

  const selectPlant = (plant: TutorialPlant) => {
    setSelectedPlant(plant);
    if (step === 0 && plant === 'sunflower') {
      setStep(1);
    }
    if (step === 2 && plant === 'bottleGrass') {
      setStep(3);
    }
  };

  const placePlant = (plant: TutorialPlant) => {
    if (step === 1 && selectedPlant === 'sunflower' && plant === 'sunflower') {
      setPlaced(prev => ({ ...prev, sunflower: true }));
      setSelectedPlant(null);
      setStep(2);
    }
    if (step === 3 && selectedPlant === 'bottleGrass' && plant === 'bottleGrass') {
      setPlaced(prev => ({ ...prev, bottleGrass: true }));
      setSelectedPlant(null);
      setStep(4);
    }
  };

  const startWave = () => {
    if (step >= 4) {
      setSelectedPlant(null);
      setStep(5);
    }
  };

  const resetTutorial = () => {
    setStep(0);
    setSelectedPlant(null);
    setPlaced({ sunflower: false, bottleGrass: false });
  };

  return (
    <main className="tutorial-wrap">
      <section className="tutorial-layout">
        <div className="glass-panel tutorial-board card-enter" style={{ opacity: 0, animationDelay: '0s' }}>
          <div className="tutorial-heading">
            <div>
              <div className="eyebrow">Training</div>
              <h1>新手训练</h1>
            </div>
            <div className="game-stat">金币: 1000</div>
          </div>

          <div className="tutorial-map-frame">
            <svg viewBox="0 0 640 360" role="img" aria-label="新手训练地图">
              <rect x="0" y="0" width="640" height="360" fill="#f8fafc" />
              <defs>
                <pattern id="tutorial-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                </pattern>
                <path id="tutorial-motion-path" d="M 32 260 H 220 V 110 H 430 V 250 H 604" />
              </defs>
              <rect x="0" y="0" width="640" height="360" fill="url(#tutorial-grid)" />
              <path
                d="M 32 260 H 220 V 110 H 430 V 250 H 604"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="54"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 32 260 H 220 V 110 H 430 V 250 H 604"
                fill="none"
                stroke="#ffffff"
                strokeWidth="42"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {Object.entries(PLOTS).map(([plant, point]) => {
                const id = plant as TutorialPlant;
                const active = (step === 1 && id === 'sunflower') || (step === 3 && id === 'bottleGrass');
                return (
                  <g
                    key={id}
                    className={active ? 'tutorial-plot tutorial-plot-active' : 'tutorial-plot'}
                    onClick={() => placePlant(id)}
                  >
                    <circle cx={point.x} cy={point.y} r={30} fill={active ? '#fef3c7' : '#ecfdf5'} stroke={active ? '#f59e0b' : '#86efac'} strokeWidth="2" />
                    <circle cx={point.x} cy={point.y} r={6} fill={active ? '#f59e0b' : '#22c55e'} />
                  </g>
                );
              })}

              {placed.sunflower && (
                <foreignObject x={PLOTS.sunflower.x - 24} y={PLOTS.sunflower.y - 24} width="48" height="48">
                  <div className="tutorial-plant-icon">{BASE_PLANTS_CONFIG.sunflower.icon}</div>
                </foreignObject>
              )}
              {placed.bottleGrass && (
                <foreignObject x={PLOTS.bottleGrass.x - 24} y={PLOTS.bottleGrass.y - 24} width="48" height="48">
                  <div className="tutorial-plant-icon">{BASE_PLANTS_CONFIG.bottleGrass.icon}</div>
                </foreignObject>
              )}

              <g transform="translate(590 226)">
                <rect x="-22" y="4" width="44" height="34" rx="4" fill="#fed7aa" stroke="#fb923c" strokeWidth="2" />
                <path d="M -30 8 L 0 -20 L 30 8 Z" fill="#fb7185" stroke="#e11d48" strokeWidth="2" />
                <rect x="-7" y="17" width="14" height="21" fill="#92400e" />
              </g>

              {step === 5 && (
                <circle r="12" fill="#64748b" stroke="#0f172a" strokeWidth="3">
                  <animateMotion dur="4s" repeatCount="indefinite">
                    <mpath href="#tutorial-motion-path" />
                  </animateMotion>
                </circle>
              )}
            </svg>
          </div>

          <div className="tutorial-tool-row">
            {PLANT_BUTTONS.map(({ id, role }) => {
              const cfg = BASE_PLANTS_CONFIG[id];
              const active = selectedPlant === id;
              return (
                <button
                  key={id}
                  onClick={() => selectPlant(id)}
                  className={active ? 'tutorial-plant-button active' : 'tutorial-plant-button'}
                >
                  <span className="tutorial-tool-icon">{cfg.icon}</span>
                  <span>
                    <strong>{cfg.name}</strong>
                    <small>{role} · {cfg.cost} 金币</small>
                  </span>
                </button>
              );
            })}
            <button
              onClick={startWave}
              disabled={step < 4}
              className="action-button primary"
              style={{ opacity: step < 4 ? 0.52 : 1 }}
            >
              启动波次
            </button>
          </div>
        </div>

        <aside className="glass-panel tutorial-guide card-enter" style={{ opacity: 0, animationDelay: '0.08s' }}>
          <div className="eyebrow">{current.eyebrow}</div>
          <h2>{current.title}</h2>
          <p>{current.body}</p>

          <div className="tutorial-note">
            <strong>奖励规则</strong>
            <span>宝箱里的金币要开启时才知道；开箱可得金币、植物碎片、元素碎片，也有小概率出神奇钥匙。</span>
          </div>

          <div className="tutorial-progress">
            {Object.keys(STEP_COPY).map(key => {
              const index = Number(key);
              return <span key={key} className={index <= step ? 'tutorial-dot active' : 'tutorial-dot'} />;
            })}
          </div>

          <div className="button-row" style={{ marginTop: 'auto' }}>
            <button onClick={onComplete} disabled={step < 5} className="action-button primary" style={{ opacity: step < 5 ? 0.52 : 1 }}>
              完成教程
            </button>
            <button onClick={onComplete} className="action-button">
              跳过教程
            </button>
            {step > 0 && step < 5 && (
              <button onClick={resetTutorial} className="action-button">
                重来
              </button>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
