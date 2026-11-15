// 정면 맞추기(캘리브레이션) 진행 화면 + 결과 토스트
import { Mascot, Modal, ProgressRing, Toast } from './ui';

export function CalibrationOverlay({ progress }) {
  return (
    <Modal titleId="calib-title">
      <Mascot mood="happy" size={72} bob className="modal__mascot" />
      <h2 id="calib-title" className="modal__title">
        화면을 편하게 바라봐 주세요
      </h2>
      <p className="modal__body">3초 동안 지금 자세를 정면으로 기억해요.</p>
      <div className="calib-ring">
        <ProgressRing progress={progress} size={128} stroke={9}>
          <span className="calib-ring__count">{Math.max(1, Math.ceil(3 - progress * 3))}</span>
        </ProgressRing>
      </div>
    </Modal>
  );
}

export function CalibrationToast({ result, onClose }) {
  if (!result) return null;
  return result === 'success' ? (
    <Toast tone="good" onClose={onClose}>
      정면을 기억했어요!
    </Toast>
  ) : (
    <Toast tone="warn" onClose={onClose}>
      얼굴이 잘 보이지 않아요. 밝은 곳에서 다시 시도해 주세요.
    </Toast>
  );
}
