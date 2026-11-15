// 3단계 졸음 대응: "일어나서 스트레칭" 미션
// 카메라로 동작을 확인한다: 고개 한쪽 → 반대쪽 → 일어나서 화면 밖으로 → 다시 앉기
// 카메라가 꺼져 있거나 인식이 잘 안 될 때를 위해 일정 시간 뒤 "직접 완료" 버튼을 보여준다.
import { useEffect, useRef, useState } from 'react';
import { Check, Hand } from 'lucide-react';
import { Button, Mascot, Modal } from './ui';

const TURN_DEG = 25; // 고개 돌림으로 인정할 각도
const LEAVE_SEC = 2; // 화면 밖으로 벗어나 있어야 하는 시간
const MANUAL_AFTER_SEC = 30; // 이 시간이 지나면 직접 완료 버튼 표시

const STEPS = [
  { title: '고개를 한쪽으로 천천히 돌려요', hint: '목을 쭉 늘려 주세요' },
  { title: '반대쪽으로도 돌려요', hint: '양쪽 다 시원하게!' },
  { title: '자리에서 일어나 기지개를 켜요', hint: `카메라 밖으로 ${LEAVE_SEC}초 이상 벗어나 주세요` },
  { title: '다시 앉아서 화면을 봐요', hint: '정면을 보면 미션 완료!' },
];

export default function StretchMission({ metrics, cameraReady, onComplete }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const firstSideRef = useRef(0); // 처음 돌린 방향 (+1 / -1)

  // 경과 시간 (직접 완료 버튼용)
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // 감지 수치가 들어올 때마다 현재 단계를 확인
  useEffect(() => {
    if (!metrics || done) return;
    const { face, yaw, faceLostFor } = metrics;
    if (step === 0 && face && Math.abs(yaw) >= TURN_DEG) {
      firstSideRef.current = Math.sign(yaw);
      setStep(1);
    } else if (step === 1 && face && Math.abs(yaw) >= TURN_DEG && Math.sign(yaw) !== firstSideRef.current) {
      setStep(2);
    } else if (step === 2 && !face && faceLostFor >= LEAVE_SEC) {
      setStep(3);
    } else if (step === 3 && face && Math.abs(yaw) < 15) {
      setDone(true);
    }
  }, [metrics, step, done]);

  // 완료 축하를 잠깐 보여준 뒤 닫기
  useEffect(() => {
    if (!done) return undefined;
    const id = setTimeout(onComplete, 1400);
    return () => clearTimeout(id);
  }, [done, onComplete]);

  const showManual = !cameraReady || elapsed >= MANUAL_AFTER_SEC;

  return (
    <Modal titleId="mission-title">
      <Mascot mood={done ? 'happy' : 'sleepy'} size={88} bob className="modal__mascot" />
      <h2 id="mission-title" className="modal__title">
        {done ? '미션 완료! 다시 집중해 볼까요?' : '졸음 깨기 미션!'}
      </h2>
      <p className="modal__body">
        {done ? '타이머가 다시 움직여요.' : '계속 졸고 있어요. 미션을 마칠 때까지 타이머가 멈춰 있어요.'}
      </p>

      <ol className="mission-steps">
        {STEPS.map((s, i) => {
          const state = done || i < step ? 'done' : i === step ? 'current' : 'todo';
          return (
            <li key={s.title} className={`mission-step mission-step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="mission-step__mark" aria-hidden="true">
                {state === 'done' ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span>
                <span className="mission-step__title">{s.title}</span>
                {state === 'current' && <span className="mission-step__hint">{s.hint}</span>}
              </span>
            </li>
          );
        })}
      </ol>

      {!done && (
        <div className="modal__actions">
          {showManual ? (
            <Button variant="ghost" icon={Hand} block onClick={() => setDone(true)}>
              {cameraReady ? '인식이 잘 안 돼요 · 직접 완료하기' : '스트레칭했어요 · 완료하기'}
            </Button>
          ) : (
            <p className="text-xs text-muted">카메라가 동작을 확인하고 있어요</p>
          )}
        </div>
      )}
    </Modal>
  );
}
