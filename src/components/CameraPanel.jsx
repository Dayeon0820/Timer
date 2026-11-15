// 오른쪽 카메라 패널: 웹캠 미리보기 + 상태 + 디버그 + 정면 맞추기
import { useState } from 'react';
import { Activity, Camera, CameraOff, Info, ScanFace, ShieldCheck } from 'lucide-react';
import { Button, Card, Chip, Mascot, StatusDot } from './ui';
import { STATUS_INFO } from '../lib/defaults';
import { STATUS_ICON } from '../lib/statusIcons';

const fmt = (n, digits = 0) => (Number.isFinite(n) ? n.toFixed(digits) : '-');

function DebugPanel({ metrics, settings }) {
  const rows = [
    ['얼굴', metrics.face ? '검출됨' : `없음 ${fmt(metrics.faceLostFor, 1)}s`, !metrics.face],
    ['눈 감김 L', fmt(metrics.blinkL, 2), metrics.blinkL >= settings.blinkThreshold],
    ['눈 감김 R', fmt(metrics.blinkR, 2), metrics.blinkR >= settings.blinkThreshold],
    ['Yaw 좌우', `${fmt(metrics.yaw)}°`, Math.abs(metrics.yaw) >= settings.yawThreshold],
    ['Pitch 아래+', `${fmt(metrics.pitch)}°`, metrics.pitch >= settings.pitchThreshold],
    ['눈 감은 지', `${fmt(metrics.eyesClosedFor, 1)}s`, false],
    ['고개 돌린 지', `${fmt(metrics.headAwayFor, 1)}s`, false],
    // 초당 분석 횟수가 너무 낮으면(5 미만) 감지가 늦어지므로 강조
    ['분석 속도', `${metrics.fps ?? 0} FPS · ${metrics.delegate ?? '-'}`, (metrics.fps ?? 0) < 5],
  ];
  return (
    <dl className="debug">
      {rows.map(([k, v, hit]) => (
        <div key={k} className={hit ? 'is-hit' : ''}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function CameraPanel({ detector, settings, session, running, phase, onToggleCamera, onCalibrate, onToggleDebug }) {
  const { videoRef, cameraState, status, metrics, calibration, baseline } = detector;
  const [showPrivacy, setShowPrivacy] = useState(false);
  const ready = cameraState === 'ready';
  const busy = cameraState === 'requesting' || cameraState === 'loading';
  const cameraOn = ready || busy;
  const info = STATUS_INFO[ready ? status : busy ? 'loading' : 'idle'];
  const StatusIcon = STATUS_ICON[ready ? status : busy ? 'loading' : 'idle'];

  const headerText = ready ? '카메라 모니터링 중' : busy ? '카메라 준비 중' : '카메라 꺼짐';
  const infoText = !ready
    ? '카메라를 켜면 졸음과 딴짓을 알려드려요'
    : status === 'focused'
      ? '딴짓이 감지되면 알려드려요!'
      : info.message;

  return (
    <div className="camera-column" id="camera-section">
      <Card
        tight
        className="camera-panel"
        title={
          <>
            <StatusDot tone={ready ? info.tone : undefined} />
            {headerText}
          </>
        }
        action={
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={Activity}
            label={settings.showDebug ? '디버그 정보 끄기' : '디버그 정보 켜기'}
            aria-pressed={settings.showDebug}
            onClick={onToggleDebug}
          />
        }
      >
        <div className={`camera-view camera-view--${ready ? info.tone : 'off'}`}>
          {/* video 요소는 항상 렌더링해 두어야 감지 훅이 언제든 스트림을 연결할 수 있다 */}
          <video ref={videoRef} className="camera-view__video" playsInline muted style={{ opacity: cameraOn ? 1 : 0 }} />

          {!ready && (
            <div className="camera-view__empty">
              <Mascot mood={busy ? 'happy' : 'idle'} size={72} bob={busy} />
              <p>{busy ? info.message : '카메라가 꺼져 있어요'}</p>
              {!busy && (
                <Button variant="primary" size="sm" icon={Camera} onClick={onToggleCamera}>
                  카메라 켜기
                </Button>
              )}
            </div>
          )}

          {ready && (
            <>
              <div className="camera-view__frame" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <Chip tone={info.tone === 'muted' ? undefined : info.tone} icon={StatusIcon} className="camera-view__status">
                {info.message}
              </Chip>
            </>
          )}

          {settings.showDebug && ready && metrics && <DebugPanel metrics={metrics} settings={settings} />}
        </div>

        <div className="camera-panel__counts" aria-label="이번 세션 감지 횟수">
          <Chip icon={STATUS_ICON.drowsy}>졸음 {session.drowsy}</Chip>
          <Chip icon={STATUS_ICON.distracted}>딴짓 {session.distracted}</Chip>
          <Chip icon={STATUS_ICON.away}>자리비움 {session.away}</Chip>
        </div>
      </Card>

      {/* 안내 바 */}
      <div className="info-bar">
        <ShieldCheck size={18} strokeWidth={2.2} aria-hidden="true" />
        <span>{infoText}</span>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          icon={Info}
          label="개인정보 안내"
          aria-expanded={showPrivacy}
          onClick={() => setShowPrivacy((v) => !v)}
        />
      </div>
      {showPrivacy && (
        <p className="privacy-note">영상은 이 브라우저 안에서만 분석되며, 기기 밖으로 전송되거나 저장되지 않아요.</p>
      )}

      <div className="camera-actions">
        <Button size="sm" icon={cameraOn ? CameraOff : Camera} onClick={onToggleCamera}>
          {cameraOn ? '카메라 끄기' : '카메라 켜기'}
        </Button>
        <Button
          size="sm"
          icon={ScanFace}
          onClick={onCalibrate}
          disabled={calibration.active || (running && phase === 'focus')}
          title={running ? '타이머를 멈춘 뒤 정면을 맞출 수 있어요' : '3초 동안 화면을 바라보면 지금 자세를 정면으로 기억해요'}
        >
          정면 맞추기
        </Button>
      </div>
      <p className="calib-note">
        {baseline
          ? '정면이 저장돼 있어요 · 자세가 바뀌면 다시 맞춰 주세요'
          : '시작 전에 정면을 맞추면 더 정확해요'}
      </p>
    </div>
  );
}
