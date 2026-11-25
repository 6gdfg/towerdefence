import { CURRENT_RELEASE } from '../../shared/releaseNotes';

type UpdateAnnouncementModalProps = {
  confirming: boolean;
  error: string | null;
  onConfirm: () => void;
};

export default function UpdateAnnouncementModal({ confirming, error, onConfirm }: UpdateAnnouncementModalProps) {
  const releaseDate = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${CURRENT_RELEASE.releaseDate}T00:00:00Z`));

  return (
    <div className="modal-backdrop update-announcement-backdrop" style={{ zIndex: 1250 }}>
      <section className="glass-panel modal-panel update-announcement-modal" role="dialog" aria-modal="true" aria-label="更新公告">
        <div className="eyebrow">UPDATE</div>
        <header className="update-announcement-heading">
          <h2>{CURRENT_RELEASE.title}</h2>
          <p className="update-announcement-date">更新时间：<time dateTime={CURRENT_RELEASE.releaseDate}>{releaseDate}</time></p>
        </header>
        <div className="update-announcement-list">
          {CURRENT_RELEASE.notes.map(note => <p key={note}>{note}</p>)}
        </div>
        {error && <p className="update-announcement-error">{error}</p>}
        <button type="button" className="action-button" onClick={onConfirm} disabled={confirming}>
          {confirming ? '确认中...' : '确定'}
        </button>
      </section>
    </div>
  );
}
