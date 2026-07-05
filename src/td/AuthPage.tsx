import AuthBar from './AuthBar';

type AuthPageProps = {
  onAuthed: () => void;
};

export default function AuthPage({ onAuthed }: AuthPageProps) {
  return (
    <div className="auth-layout">
      <div className="glass-panel hero-panel auth-card">
        <div className="eyebrow">Tower Defense</div>
        <h1 style={{ margin: '12px 0 18px', fontSize: 30, lineHeight: 1.12 }}>登录 / 注册</h1>
        <AuthBar variant="card" onAuthed={onAuthed} />
      </div>
    </div>
  );
}
