import RainbowText from './RainbowText';

type AboutModalProps = {
  onClose: () => void;
};

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2>关于</h2>
        <RainbowText text="Tower Defence Version 0.0.5" />
        <h2>鸣谢</h2>
        <p>总策划:hebscyf</p>
        <p>代码:6gdfg</p>
        <p>测试员&贡献者:hebscyf,windymu,mountain,even zao</p>
        <button onClick={onClose} className="btn-hover" style={{ alignSelf: 'flex-end', padding:'6px 12px', borderRadius:8, border:'1px solid #d1d5db', background:'#ffffff', color:'#111827', cursor:'pointer' }}>
          关闭
        </button>
      </div>
    </div>
  );
}
