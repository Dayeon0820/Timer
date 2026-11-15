// 카메라 권한 거부 / 오류 시 안내 화면
import { RotateCcw, ShieldCheck, Timer } from 'lucide-react';
import { Button, Mascot, Modal } from './ui';

export default function PermissionNotice({ cameraState, errorMessage, onRetry, onSkip }) {
  const denied = cameraState === 'denied';
  return (
    <Modal titleId="notice-title">
      <Mascot mood="worried" size={88} className="modal__mascot" />
      <h2 id="notice-title" className="modal__title">
        {denied ? '카메라 권한이 필요해요' : '카메라를 사용할 수 없어요'}
      </h2>
      <div className="modal__body">
        {denied ? (
          <>
            <p>졸음·딴짓 감지를 위해 웹캠 접근을 허용해 주세요.</p>
            <ol className="steps">
              <li>주소창 왼쪽의 자물쇠(또는 카메라) 아이콘을 누르세요.</li>
              <li>
                <b>카메라</b>를 <b>허용</b>으로 바꾸세요.
              </li>
              <li>
                아래 <b>다시 시도</b>를 누르세요. 안 되면 새로고침해 주세요.
              </li>
            </ol>
          </>
        ) : (
          <p>{errorMessage || '알 수 없는 오류가 발생했어요.'}</p>
        )}
        <p className="privacy-inline">
          <ShieldCheck size={16} aria-hidden="true" />
          영상은 이 브라우저 안에서만 분석되며 기기 밖으로 전송되거나 저장되지 않아요.
        </p>
      </div>
      <div className="modal__actions">
        <Button variant="primary" icon={RotateCcw} block onClick={onRetry}>
          다시 시도
        </Button>
        <Button variant="ghost" icon={Timer} block onClick={onSkip}>
          감지 없이 타이머만 쓰기
        </Button>
      </div>
    </Modal>
  );
}
