import AuthBar from './AuthBar';

type AuthPageProps = {
  onAuthed: () => void;
};

export default function AuthPage({ onAuthed }: AuthPageProps) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width: 400, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:20, boxShadow:'0 10px 30px rgba(0,0,0,0.08)' }}>
        <div style={{ fontWeight:700, marginBottom:16, fontSize:18 }}>登录 / 注册</div>
        <AuthBar variant="card" onAuthed={onAuthed} />
      </div>
    </div>
  );
}
