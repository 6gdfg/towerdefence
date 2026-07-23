import RainbowText from './RainbowText';
import { CURRENT_RELEASE } from '../../shared/releaseNotes';

type AboutModalProps = {
  onClose: () => void;
};

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="modal-backdrop" style={{ zIndex: 100 }}>
      <div className="glass-panel modal-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2>关于</h2>
        <RainbowText text={CURRENT_RELEASE.title} />
        <h2>鸣谢</h2>
        <p>总策划:hebscyf</p>
        <p>代码:6gdfg</p>
        <p>测试员&贡献者:hebscyf,windymu,mountain,even zao</p>
        <button onClick={onClose} className="action-button" style={{ alignSelf: 'flex-end' }}>
          关闭
        </button>
      </div>
    </div>
  );
}
