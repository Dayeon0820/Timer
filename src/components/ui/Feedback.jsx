// 피드백 컴포넌트: 칩, 상태 점, 모달, 토스트
import { CircleCheck, TriangleAlert } from 'lucide-react';
import Mascot from './Mascot';

/** tone: good | warn | bad | rest | focus | (기본 muted) */
export function Chip({ tone, icon: Icon, children, className = '' }) {
  return (
    <span className={`chip ${tone ? `chip--${tone}` : ''} ${className}`}>
      {Icon && <Icon size={14} strokeWidth={2.4} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function StatusDot({ tone }) {
  return <span className={`status-dot ${tone ? `status-dot--${tone}` : ''}`} aria-hidden="true" />;
}

export function Modal({ titleId, children }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="modal">{children}</div>
    </div>
  );
}

/** tone: good | warn */
export function Toast({ tone = 'good', children, onClose }) {
  const Icon = tone === 'good' ? CircleCheck : TriangleAlert;
  return (
    <div className={`toast toast--${tone}`} role="status" onClick={onClose}>
      <Icon size={18} strokeWidth={2.4} aria-hidden="true" />
      {children}
    </div>
  );
}

/** 분석 문장 카드: 마스코트 표정 + 제목 + 설명 (tone: good | warn) */
export function Insight({ tone, mood = 'happy', title, detail }) {
  return (
    <div className={`insight ${tone ? `insight--${tone}` : ''}`}>
      <Mascot mood={mood} size={44} />
      <div>
        <p className="insight__title">{title}</p>
        {detail && <p className="insight__detail">{detail}</p>}
      </div>
    </div>
  );
}
