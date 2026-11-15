// 앱 최상위 컴포넌트: 감지 훅 + 타이머 훅을 연결하고 탭(타이머/기록/설정)을 전환한다.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChartColumn, Settings, Timer } from 'lucide-react';
import { useSettings } from './hooks/useSettings';
import { useFocusDetector } from './hooks/useFocusDetector';
import { usePomodoro } from './hooks/usePomodoro';
import { useDrowsyEscalation } from './hooks/useDrowsyEscalation';
import StretchMission from './components/StretchMission';
import { addToToday } from './lib/storage';
import { playChime, playWarning, unlockAudio } from './lib/alarm';
import { Mascot, TabNav } from './components/ui';
import TimerView, { formatTime } from './components/TimerView';
import SettingsView from './components/SettingsView';
import HistoryView from './components/HistoryView';
import AlertOverlay from './components/AlertOverlay';
import PermissionNotice from './components/PermissionNotice';
import { CalibrationOverlay, CalibrationToast } from './components/CalibrationOverlay';

const TABS = [
  { id: 'timer', label: '타이머', icon: Timer },
  { id: 'history', label: '기록', icon: ChartColumn },
  { id: 'settings', label: '설정', icon: Settings },
];
const BROKEN_STATES = ['drowsy', 'distracted', 'away'];
const WARNING_REPEAT_MS = 5000; // 집중이 깨진 상태가 계속되면 5초마다 경고음 반복

export default function App() {
  const { settings, update, resetToDefault } = useSettings();
  const detector = useFocusDetector(settings);
  const [tab, setTab] = useState('timer');
  const [session, setSession] = useState({ drowsy: 0, distracted: 0, away: 0 });
  const [skipCamera, setSkipCamera] = useState(false); // "감지 없이 타이머만 쓰기"

  const [missionOpen, setMissionOpen] = useState(false); // 3단계 스트레칭 미션 진행 중

  // 카메라가 동작 중이고 졸음/딴짓/자리비움 상태이면 집중이 깨진 것
  const broken = detector.cameraState === 'ready' && BROKEN_STATES.includes(detector.status);

  const soundRef = useRef(settings.soundEnabled);
  soundRef.current = settings.soundEnabled;

  const pomodoro = usePomodoro({
    focusMinutes: settings.focusMinutes,
    breakMinutes: settings.breakMinutes,
    hold: broken || missionOpen, // 집중이 깨지거나 미션 중이면 자동 일시정지, 돌아오면 자동 재개
    onFocusSeconds: (sec) => addToToday({ focusSeconds: sec }),
    onHeldSeconds: (sec) => addToToday({ heldSeconds: sec }), // 시간대별 집중도 계산용
    onPhaseEnd: (phase) => {
      if (phase === 'focus') addToToday({ pomodoros: 1 });
      if (soundRef.current) playChime();
    },
  });

  // 타이머가 실제로 자동 일시정지된 상태인지 (집중 구간 + 실행 중 + 집중 깨짐)
  // 미션 중에는 일부러 고개를 돌리고 자리를 비우므로 딴짓/자리비움으로 치지 않는다.
  const focusRunning = pomodoro.running && pomodoro.phase === 'focus';
  const held = broken && focusRunning && !missionOpen;

  // 졸음 단계별 대응 (1 화면 깜빡임 → 2 경고음 → 3 스트레칭 미션)
  const drowsyLevel = useDrowsyEscalation({
    drowsyActive: held && detector.status === 'drowsy',
    enabled: settings.drowsyEscalation,
    missionEnabled: settings.stretchMission,
    soundEnabled: settings.soundEnabled,
    missionOpen,
    onMission: () => setMissionOpen(true),
  });

  // 집중이 깨질 때마다: 횟수 기록 + (딴짓/자리비움은) 경고음
  // 졸음의 소리는 단계별 대응 훅이 담당한다.
  useEffect(() => {
    if (!held) return undefined;
    const kind = detector.status;
    setSession((s) => ({ ...s, [kind]: s[kind] + 1 }));
    addToToday({ [kind]: 1 });
    if (kind === 'drowsy') return undefined;
    if (soundRef.current) playWarning();
    const id = setInterval(() => soundRef.current && playWarning(), WARNING_REPEAT_MS);
    return () => clearInterval(id);
  }, [held, detector.status]);

  // 미션 중에 타이머를 멈추거나 리셋하면 미션도 닫는다
  useEffect(() => {
    if (!focusRunning) setMissionOpen(false);
  }, [focusRunning]);

  const completeMission = useCallback(() => setMissionOpen(false), []);

  // 캘리브레이션 결과 토스트는 3초 뒤 자동으로 닫기
  const { result: calibResult } = detector.calibration;
  const { dismissCalibrationResult } = detector;
  useEffect(() => {
    if (!calibResult) return undefined;
    const id = setTimeout(dismissCalibrationResult, 3000);
    return () => clearTimeout(id);
  }, [calibResult, dismissCalibrationResult]);

  // 브라우저 탭 제목에 남은 시간 표시
  useEffect(() => {
    document.title = pomodoro.running
      ? `${held ? '⏸ ' : ''}${formatTime(pomodoro.remainingMs)} · ${pomodoro.phase === 'focus' ? '집중' : '휴식'}`
      : '집중 타이머';
  }, [pomodoro.remainingMs, pomodoro.running, pomodoro.phase, held]);

  // ---- 버튼 핸들러 ----
  const handleStart = () => {
    unlockAudio(); // 사용자 클릭 시점에 오디오 활성화 (자동재생 정책)
    if (!skipCamera && detector.cameraState === 'off') detector.start();
    pomodoro.start();
  };

  const handleReset = () => {
    pomodoro.reset();
    setSession({ drowsy: 0, distracted: 0, away: 0 });
  };

  const handleToggleCamera = () => {
    if (['off', 'denied', 'error'].includes(detector.cameraState)) {
      setSkipCamera(false);
      detector.start();
    } else {
      detector.stop();
    }
  };

  const handleCalibrate = () => {
    unlockAudio();
    setSkipCamera(false);
    detector.calibrate();
  };

  const showNotice = !skipCamera && (detector.cameraState === 'denied' || detector.cameraState === 'error');

  return (
    <div className={`app app--${tab} ${held ? 'is-held' : ''} ${pomodoro.phase === 'break' ? 'is-rest' : ''}`}>
      <header className="app-header">
        <div className="brand">
          <span className="brand__logo">
            <Mascot size={40} />
          </span>
          <span className="brand__name">집중 타이머</span>
        </div>
        <TabNav items={TABS} value={tab} onChange={setTab} variant="pill" className="app-header__nav" />
      </header>

      <main className="app-main">
        {/* 타이머 화면은 웹캠 video 요소를 품고 있으므로 다른 탭에서도 숨기기만 하고 유지한다 */}
        <div hidden={tab !== 'timer'} className="view-timer">
          <TimerView
            pomodoro={pomodoro}
            detector={detector}
            settings={settings}
            session={session}
            held={held || missionOpen}
            onStart={handleStart}
            onPause={pomodoro.pause}
            onReset={handleReset}
            onSkip={pomodoro.skip}
            onCalibrate={handleCalibrate}
            onToggleCamera={handleToggleCamera}
            onToggleDebug={() => update({ showDebug: !settings.showDebug })}
          />
        </div>
        {tab === 'history' && <HistoryView />}
        {tab === 'settings' && (
          <SettingsView
            settings={settings}
            update={update}
            resetToDefault={resetToDefault}
            onResetCalibration={detector.resetCalibration}
            hasCalibration={!!detector.baseline}
          />
        )}
      </main>

      {/* 모바일 하단 탭바 */}
      <div className="app-tabbar">
        <TabNav items={TABS} value={tab} onChange={setTab} variant="bar" />
      </div>

      {held && <AlertOverlay status={detector.status} level={drowsyLevel} escalation={settings.drowsyEscalation} />}
      {missionOpen && (
        <StretchMission metrics={detector.metrics} cameraReady={detector.cameraState === 'ready'} onComplete={completeMission} />
      )}
      {detector.calibration.active && <CalibrationOverlay progress={detector.calibration.progress} />}
      <CalibrationToast result={calibResult} onClose={dismissCalibrationResult} />
      {showNotice && (
        <PermissionNotice
          cameraState={detector.cameraState}
          errorMessage={detector.errorMessage}
          onRetry={() => detector.start()}
          onSkip={() => setSkipCamera(true)}
        />
      )}
    </div>
  );
}
