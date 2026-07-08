import type { FunModeType } from './funModes';

type FunModePageProps = {
  onBack: () => void;
  onStartMode: (mode: FunModeType) => void;
  onOpenLab: () => void;
};

const modes: Array<{
  id: FunModeType;
  title: string;
  copy: string;
  action: string;
  primary?: boolean;
}> = [
  {
    id: 'test',
    title: '测试模式',
    copy: '全部植物与元素解锁，开始前逐一设定等级。',
    action: '配置并开始',
    primary: true,
  },
  {
    id: 'endless',
    title: '无尽模式',
    copy: '沿用当前账号配置，逐波强化敌人。',
    action: '直接开始',
  },
  {
    id: 'random',
    title: '随机模式',
    copy: '地图、阳光、植物、元素与波次都会随机生成。',
    action: '立即开局',
    primary: true,
  },
];

export default function FunModePage({ onBack, onStartMode, onOpenLab }: FunModePageProps) {
  return (
    <main className="page-wrap">
      <section className="glass-panel hero-panel card-enter" style={{ opacity: 0, animationDelay: '0s' }}>
        <div className="page-title-row">
          <div>
            <div className="eyebrow">Free Play</div>
            <h1>趣味模式</h1>
            <p>测试、无尽和随机挑战都放在这里。</p>
          </div>
          <button onClick={onBack} className="action-button">返回主界面</button>
        </div>
      </section>

      <section className="mode-grid" style={{ marginTop: 16 }}>
        <article
          className="soft-card mode-card card-enter"
          style={{
            opacity: 0,
            animationDelay: '0.04s',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div>
            <div className="section-title" style={{ marginBottom: 6 }}>平衡实验室</div>
            <p className="muted">全植物、全元素、自定义波次和数值，用来临时调关。</p>
          </div>
          <button
            onClick={onOpenLab}
            className="action-button primary"
            style={{ marginTop: 'auto' }}
          >
            打开实验室
          </button>
        </article>
        {modes.map((mode, index) => (
          <article
            key={mode.id}
            className="soft-card mode-card card-enter"
            style={{
              opacity: 0,
              animationDelay: `${0.12 + index * 0.06}s`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div>
              <div className="section-title" style={{ marginBottom: 6 }}>{mode.title}</div>
              <p className="muted">{mode.copy}</p>
            </div>
            <button
              onClick={() => onStartMode(mode.id)}
              className={mode.primary ? 'action-button primary' : 'action-button'}
              style={{ marginTop: 'auto' }}
            >
              {mode.action}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
