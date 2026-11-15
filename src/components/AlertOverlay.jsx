// 집중이 깨졌을 때: 화면 가장자리를 상태 색으로 은은하게 물들이고 상단에 안내 배너 표시
// 졸음일 때는 단계(level)에 따라 화면 깜빡임 + 단계 표시가 추가된다.
// 화면을 가리지 않는 배너 형태 → 사용자가 다시 정면을 보면 자동으로 사라진다.
import { Mascot } from './ui';
import { ALERT_MESSAGE, STATUS_INFO } from '../lib/defaults';

const DROWSY_MESSAGE = {
  1: '눈을 감고 계신 것 같아요. 눈을 크게 떠 볼까요?',
  2: '계속 졸고 있어요! 조금 더 졸면 스트레칭 미션이 시작돼요.',
  3: '정신이 번쩍 들게 일어나 볼까요?',
};
const LEVEL_NAME = { 1: '화면 깜빡임', 2: '경고음', 3: '강한 알람' };

export default function AlertOverlay({ status, level = 0, escalation = true }) {
  const info = STATUS_INFO[status];
  const drowsyStep = status === 'drowsy' && escalation && level > 0;

  return (
    <>
      <div className={`alert-vignette alert-vignette--${info.tone}`} aria-hidden="true" />
      {/* 졸음 1단계 이상: 화면 전체를 짧게 깜빡여 깨운다 */}
      {drowsyStep && <div className={`alert-flash alert-flash--${level}`} aria-hidden="true" />}

      <div className={`alert-banner alert-banner--${level >= 3 ? 'bad' : info.tone}`} role="alert">
        <Mascot mood={info.mood} size={52} />
        <div>
          <strong>
            {info.label} · 타이머 일시정지
            {drowsyStep && (
              <span className="level-dots" data-level={level} aria-label={`졸음 대응 ${level}단계: ${LEVEL_NAME[level]}`}>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={n <= level ? 'is-on' : ''} />
                ))}
              </span>
            )}
          </strong>
          <p>{drowsyStep ? DROWSY_MESSAGE[level] : ALERT_MESSAGE[status]}</p>
        </div>
      </div>
    </>
  );
}
