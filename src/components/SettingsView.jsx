// 설정 화면: 타이머 시간, 감지 기준값, 알림
import { AlarmClock, Bell, Eye, Moon, RotateCcw, ScanFace, Timer, UserX } from 'lucide-react';
import { Button, Card, SliderField, Stepper, SwitchField } from './ui';
import { DEFAULT_SETTINGS as D, ESCALATION_STEPS } from '../lib/defaults';

export default function SettingsView({ settings, update, resetToDefault, onResetCalibration, hasCalibration }) {
  const s = settings;
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">설정</h1>
        <p className="page-subtitle">모든 값은 이 브라우저에 자동 저장돼요.</p>
      </header>

      <div className="settings-grid">
        <Card title="타이머" icon={Timer} subtitle="타이머가 멈춰 있을 때 바꾸면 바로 적용돼요" className="settings-timer">
          <div className="stepper-row">
            <Stepper label="집중" unit="분" value={s.focusMinutes} min={1} max={90} onChange={(v) => update({ focusMinutes: v })} />
            <Stepper label="휴식" unit="분" value={s.breakMinutes} min={1} max={30} onChange={(v) => update({ breakMinutes: v })} />
          </div>
        </Card>

        <Card title="졸음 감지" icon={Moon}>
          <SliderField
            label="눈 감김 기준"
            hint={`양쪽 눈 감김 점수가 이 값 이상이면 감은 것으로 판단 (기본 ${D.blinkThreshold})`}
            value={s.blinkThreshold}
            min={0.2}
            max={0.9}
            step={0.05}
            onChange={(v) => update({ blinkThreshold: v })}
          />
          <SliderField
            label="지속 시간"
            hint={`이 시간 이상 눈을 감고 있으면 졸음 (기본 ${D.drowsySeconds}초)`}
            value={s.drowsySeconds}
            min={0.5}
            max={10}
            step={0.5}
            unit="초"
            onChange={(v) => update({ drowsySeconds: v })}
          />
        </Card>

        <Card title="졸음 단계별 대응" icon={AlarmClock} subtitle="계속 졸수록 점점 강하게 깨워 드려요">
          <SwitchField
            label="단계별 대응"
            hint="끄면 졸음이 감지되자마자 경고음만 울려요"
            checked={s.drowsyEscalation}
            onChange={(v) => update({ drowsyEscalation: v })}
          />
          <SwitchField
            label="스트레칭 미션"
            hint="끄면 3단계에서 미션 대신 더 강한 알람이 울려요"
            checked={s.stretchMission}
            onChange={(v) => update({ stretchMission: v })}
          />
          <ol className={`level-steps ${s.drowsyEscalation ? '' : 'is-off'}`} aria-label="졸음 대응 단계">
            {ESCALATION_STEPS.map((step) => (
              <li key={step.level} className={`level-step level-step--${step.level}`}>
                <span className="level-step__mark">{step.level}</span>
                <span>
                  <span className="level-step__title">
                    {step.level === 3 && !s.stretchMission ? '강한 알람' : step.title}
                  </span>
                  <span className="level-step__detail">{step.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="딴짓 감지" icon={Eye}>
          <SliderField
            label="좌우 각도"
            hint={`기준 자세보다 이만큼 고개를 돌리면 (기본 ${D.yawThreshold}°)`}
            value={s.yawThreshold}
            min={10}
            max={60}
            unit="°"
            onChange={(v) => update({ yawThreshold: v })}
          />
          <SliderField
            label="아래 각도"
            hint={`기준 자세보다 이만큼 고개를 숙이면 (기본 ${D.pitchThreshold}°)`}
            value={s.pitchThreshold}
            min={10}
            max={60}
            unit="°"
            onChange={(v) => update({ pitchThreshold: v })}
          />
          <SliderField
            label="지속 시간"
            hint={`이 시간 이상 유지되면 딴짓 (기본 ${D.distractedSeconds}초)`}
            value={s.distractedSeconds}
            min={1}
            max={15}
            step={0.5}
            unit="초"
            onChange={(v) => update({ distractedSeconds: v })}
          />
          <SwitchField
            label="위/아래 방향 반전"
            hint="고개를 들 때 딴짓으로 잡힌다면 켜세요"
            checked={s.invertPitch}
            onChange={(v) => update({ invertPitch: v })}
          />
        </Card>

        <Card title="자리 비움" icon={UserX}>
          <SliderField
            label="얼굴 미검출 시간"
            hint={`이 시간 이상 얼굴이 안 보이면 자리 비움 (기본 ${D.awaySeconds}초)`}
            value={s.awaySeconds}
            min={2}
            max={30}
            unit="초"
            onChange={(v) => update({ awaySeconds: v })}
          />
        </Card>

        <Card title="알림 · 기타" icon={Bell}>
          <SwitchField label="경고음" hint="집중이 깨지면 소리로 알려요" checked={s.soundEnabled} onChange={(v) => update({ soundEnabled: v })} />
          <SwitchField
            label="디버그 정보"
            hint="카메라 화면에 눈 감김 점수와 고개 각도 표시"
            checked={s.showDebug}
            onChange={(v) => update({ showDebug: v })}
          />
          <div className="settings-actions">
            <Button size="sm" icon={ScanFace} onClick={onResetCalibration} disabled={!hasCalibration}>
              정면 기준 초기화
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={RotateCcw}
              onClick={() => window.confirm('모든 설정을 기본값으로 되돌릴까요?') && resetToDefault()}
            >
              기본값으로
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
