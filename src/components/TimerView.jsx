// 메인 화면: 왼쪽 타이머 + 오른쪽 카메라 패널 + 하단 지표
import { ChevronDown, Coffee, Pause, Play, RotateCcw, SkipForward, Sprout } from 'lucide-react';
import { Button, Mascot, ProgressRing, StatusDot } from './ui';
import CameraPanel from './CameraPanel';
import MetricsBar from './MetricsBar';
import { STATUS_INFO } from '../lib/defaults';

/** 밀리초 → "MM:SS" */
export function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function TimerView({
  pomodoro,
  detector,
  settings,
  session,
  held,
  onStart,
  onPause,
  onReset,
  onSkip,
  onCalibrate,
  onToggleCamera,
  onToggleDebug,
}) {
  const { phase, running, remainingMs, totalMs } = pomodoro;
  const isBreak = phase === 'break';
  const progress = totalMs > 0 ? 1 - remainingMs / totalMs : 0;
  const started = remainingMs < totalMs;

  // 마스코트 표정: 휴식 → rest, 집중이 깨짐 → 상태별 표정, 그 외 → 기본
  const mood = isBreak ? 'rest' : held ? STATUS_INFO[detector.status].mood : running ? 'happy' : 'idle';

  // 시간 아래 안내 문구
  let caption = '집중할 시간이에요!';
  if (isBreak) caption = running ? '잠깐 눈을 쉬어요' : '휴식 준비';
  else if (held) caption = '자동 일시정지 · 정면을 보면 재개돼요';
  else if (running) caption = detector.cameraState === 'ready' ? '잘하고 있어요!' : '집중 중 (감지 꺼짐)';
  else if (started) caption = '일시정지됨';

  const cameraReady = detector.cameraState === 'ready';
  const statusInfo = STATUS_INFO[detector.status] ?? STATUS_INFO.idle;
  const nextLabel = isBreak ? '집중' : '휴식';
  const nextMinutes = isBreak ? settings.focusMinutes : settings.breakMinutes;

  return (
    <div className="timer-layout">
      <section className="timer-stage" aria-label="뽀모도로 타이머">
        <h1 className={`page-title timer-stage__title ${isBreak ? 'is-rest' : ''}`}>{isBreak ? '휴식' : '집중'}</h1>

        <div className="ring-holder">
          <Mascot mood={mood} peek size={92} className="ring-holder__mascot" />
          <ProgressRing progress={progress} tone={held ? 'warn' : isBreak ? 'rest' : 'focus'}>
            <span className="timer-time" role="timer">
              {formatTime(remainingMs)}
            </span>
            <span className="timer-caption">
              {caption}
              {!held && (isBreak ? <Coffee size={16} aria-hidden="true" /> : <Sprout size={16} aria-hidden="true" />)}
            </span>
          </ProgressRing>
        </div>

        <div className="timer-controls">
          {running ? (
            <Button variant={isBreak ? 'rest' : 'primary'} size="lg" icon={Pause} onClick={onPause} className="timer-controls__main">
              일시정지
            </Button>
          ) : (
            <Button variant={isBreak ? 'rest' : 'primary'} size="lg" icon={Play} onClick={onStart} className="timer-controls__main">
              {started ? '계속하기' : '시작'}
            </Button>
          )}
          <Button size="lg" icon={RotateCcw} onClick={onReset} className="timer-controls__sub">
            리셋
          </Button>
          <Button size="lg" icon={SkipForward} onClick={onSkip} className="timer-controls__sub">
            건너뛰기
          </Button>
        </div>

        <p className="up-next">
          <span>다음</span>
          <strong className="tabular">{String(nextMinutes).padStart(2, '0')}:00</strong>
          <span>{nextLabel}</span>
        </p>

        {/* 모바일 전용: 첫 화면에서 카메라 상태를 보여주고, 누르면 카메라 섹션으로 이동 */}
        <button
          type="button"
          className="stage-camera-link"
          onClick={() => document.getElementById('camera-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          <StatusDot tone={cameraReady ? statusInfo.tone : undefined} />
          {cameraReady ? statusInfo.message : '카메라 · 기록 보기'}
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </section>

      <CameraPanel
        detector={detector}
        settings={settings}
        session={session}
        running={running}
        phase={phase}
        onToggleCamera={onToggleCamera}
        onCalibrate={onCalibrate}
        onToggleDebug={onToggleDebug}
      />

      <MetricsBar />
    </div>
  );
}
