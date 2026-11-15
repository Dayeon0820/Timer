// 웹캠 영상에서 얼굴을 분석해 집중 상태(집중/졸음/딴짓/자리비움)를 판정하는 커스텀 훅
// - React 컴포넌트는 이 훅이 돌려주는 값만 그리면 되도록 감지 로직을 모두 여기에 모았다.
// - 영상은 브라우저 안에서만 처리되며 어디로도 전송되지 않는다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { getBlendshape, matrixToEuler } from '../lib/headPose';
import { readJSON, writeJSON } from '../lib/storage';

const CALIBRATION_KEY = 'focus-timer:calibration';
const CALIBRATION_MS = 3000; // 캘리브레이션 시간 (3초)
const METRICS_INTERVAL_MS = 100; // 화면 표시용 수치는 초당 10번만 갱신 (불필요한 리렌더 방지)

// ---------------------------------------------------------------------------
// FaceLandmarker 는 무거우므로 앱 전체에서 한 번만 만들어 재사용한다.
// 모델(.task)과 WASM 모두 public/ 폴더에서 로컬로 불러온다 (외부 CDN 사용 X).
// ---------------------------------------------------------------------------
const landmarkerCache = {}; // delegate('GPU' | 'CPU') → Promise<FaceLandmarker>
let filesetPromise = null;

/**
 * @param {'GPU'|'CPU'} preferred 먼저 시도할 실행 방식. GPU 생성이 실패하면 CPU 로 바꿔 만든다.
 * @returns {Promise<{ landmarker: FaceLandmarker, delegate: 'GPU'|'CPU' }>}
 */
function loadLandmarker(preferred = 'GPU') {
  if (!landmarkerCache[preferred]) {
    landmarkerCache[preferred] = (async () => {
      const base = import.meta.env.BASE_URL; // 하위 경로(GitHub Pages)와 루트(Vercel) 모두 동작
      filesetPromise ??= FilesetResolver.forVisionTasks(`${base}wasm`);
      const fileset = await filesetPromise;
      const options = (delegate) => ({
        baseOptions: {
          modelAssetPath: `${base}models/face_landmarker.task`,
          delegate,
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true, // 눈 감김 점수(eyeBlinkLeft/Right)용
        outputFacialTransformationMatrixes: true, // 고개 각도 계산용
      });
      if (preferred === 'GPU') {
        try {
          return { landmarker: await FaceLandmarker.createFromOptions(fileset, options('GPU')), delegate: 'GPU' };
        } catch (err) {
          // GPU(WebGL)를 쓸 수 없는 환경이면 CPU로 재시도
          console.warn('[FocusDetector] GPU 초기화 실패, CPU로 전환합니다.', err);
        }
      }
      return { landmarker: await FaceLandmarker.createFromOptions(fileset, options('CPU')), delegate: 'CPU' };
    })();
    // 실패했다면 다음 시도에서 다시 로드할 수 있게 캐시를 비운다
    landmarkerCache[preferred].catch(() => {
      delete landmarkerCache[preferred];
      filesetPromise = null;
    });
  }
  return landmarkerCache[preferred];
}

// 분석이 이만큼 연속으로 실패하면 CPU 로 바꾸고, 그래도 실패하면 화면에 오류를 띄운다
const MAX_CONSECUTIVE_ERRORS = 20;
// 정면 맞추기: 3초가 지나도 프레임이 이보다 적으면 조금 더 모은다 (느린 기기 대응)
const CALIBRATION_MIN_SAMPLES = 8;
const CALIBRATION_MAX_MS = 8000;

// 조건이 이 시간 이상 연속으로 풀려야 지속 시간 측정을 초기화한다.
// (눈 감김 점수가 0.5 근처에서 한두 프레임 튀는 것 때문에 2초가 계속 리셋되는 문제 방지)
const GRACE_MS = 400;

/**
 * "조건이 언제부터 계속되고 있는지"를 기록한다.
 * @param sinceRef 조건이 처음 시작된 시각 (없으면 null)
 * @param lastRef  조건이 마지막으로 참이었던 시각
 */
function trackCondition(sinceRef, lastRef, active, now) {
  if (active) {
    lastRef.current = now;
    if (sinceRef.current === null) sinceRef.current = now;
  } else if (sinceRef.current !== null && now - lastRef.current > GRACE_MS) {
    sinceRef.current = null;
  }
}

/** 각도 차이를 -180 ~ 180 범위로 정규화 */
function normalizeAngle(a) {
  return ((((a + 180) % 360) + 360) % 360) - 180;
}

/**
 * @param {object} settings 감지 기준값 (lib/defaults.js 참고)
 * @returns 카메라/감지 상태와 제어 함수들
 */
export function useFocusDetector(settings) {
  const videoRef = useRef(null);

  // ---- 화면에 노출되는 상태 ----
  // cameraState: off | requesting | loading | ready | denied | error
  const [cameraState, setCameraState] = useState('off');
  const [errorMessage, setErrorMessage] = useState('');
  // status: idle | focused | drowsy | distracted | away
  const [status, setStatus] = useState('idle');
  const [metrics, setMetrics] = useState(null);
  const [baseline, setBaseline] = useState(() => readJSON(CALIBRATION_KEY, null));
  const [calibration, setCalibration] = useState({ active: false, progress: 0, result: null });

  // ---- 프레임 루프에서 쓰는 값들 (리렌더 없이 최신값을 읽기 위해 ref 사용) ----
  const settingsRef = useRef(settings);
  const baselineRef = useRef(baseline);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const lastMetricsAtRef = useRef(0);
  const statusRef = useRef('idle');
  const startingRef = useRef(null);

  // 지속 시간 측정용 타임스탬프 (performance.now 기준 ms)
  const eyesClosedSinceRef = useRef(null);
  const headAwaySinceRef = useRef(null);
  const eyesClosedLastRef = useRef(0);
  const headAwayLastRef = useRef(0);
  const lastFaceSeenRef = useRef(0);

  // 캘리브레이션 진행 정보
  const calibRef = useRef(null); // { startedAt, samples: [{yaw, pitch}] }

  // 분석 상태 (오류 대응 · FPS)
  const delegateRef = useRef('GPU');
  const errorCountRef = useRef(0);
  const switchingRef = useRef(false);
  const frameTimesRef = useRef([]);
  const fpsRef = useRef(0);
  const failRef = useRef(null); // 분석을 더 이상 못 할 때 호출 (아래에서 연결)

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  const updateStatus = useCallback((next) => {
    if (statusRef.current !== next) {
      statusRef.current = next;
      setStatus(next);
    }
  }, []);

  // ------------------------------------------------------------------
  // 한 프레임의 분석 결과로 상태를 판정
  // ------------------------------------------------------------------
  const analyze = useCallback(
    (result, now) => {
      const s = settingsRef.current;
      const hasFace = (result.faceLandmarks?.length ?? 0) > 0;

      let blinkL = 0;
      let blinkR = 0;
      let raw = null; // 보정 전 각도
      let yaw = 0;
      let pitch = 0;

      if (hasFace) {
        lastFaceSeenRef.current = now;

        // 1) 눈 감김 점수 (0 = 뜸, 1 = 감음)
        const categories = result.faceBlendshapes?.[0]?.categories;
        blinkL = getBlendshape(categories, 'eyeBlinkLeft');
        blinkR = getBlendshape(categories, 'eyeBlinkRight');

        // 2) 고개 각도: 변환 행렬 → 오일러 각 → 캘리브레이션 기준값과의 차이
        const matrix = result.facialTransformationMatrixes?.[0]?.data;
        if (matrix) {
          raw = matrixToEuler(matrix);
          const base = baselineRef.current ?? { yaw: 0, pitch: 0 };
          yaw = normalizeAngle(raw.yaw - base.yaw);
          pitch = normalizeAngle(raw.pitch - base.pitch) * (s.invertPitch ? -1 : 1);
        }

        // 졸음 후보: 양쪽 눈이 모두 임계값 이상으로 감김
        const eyesClosed = blinkL >= s.blinkThreshold && blinkR >= s.blinkThreshold;
        trackCondition(eyesClosedSinceRef, eyesClosedLastRef, eyesClosed, now);

        // 딴짓 후보: 좌우로 yaw 임계값 이상 돌리거나, 아래로 pitch 임계값 이상 숙임
        const headAway = raw !== null && (Math.abs(yaw) >= s.yawThreshold || pitch >= s.pitchThreshold);
        trackCondition(headAwaySinceRef, headAwayLastRef, headAway, now);
      }
      // 얼굴을 놓친 프레임에서는 눈/고개 타이머를 건드리지 않는다.
      // (고개를 크게 돌리면 얼굴 검출이 끊겼다 이어졌다 하는데, 그때마다 초기화하면 딴짓이 영영 안 잡힘)

      // ---- 최종 상태 판정 (우선순위: 자리 비움 > 졸음 > 딴짓 > 집중) ----
      const lostFor = now - lastFaceSeenRef.current;
      const drowsyNow = eyesClosedSinceRef.current !== null && now - eyesClosedSinceRef.current >= s.drowsySeconds * 1000;
      const distractedNow =
        headAwaySinceRef.current !== null && now - headAwaySinceRef.current >= s.distractedSeconds * 1000;
      let next;
      if (!hasFace && lostFor >= s.awaySeconds * 1000) {
        next = 'away';
      } else if (drowsyNow) {
        next = 'drowsy';
      } else if (distractedNow) {
        next = 'distracted';
      } else if (!hasFace) {
        // 잠깐 얼굴을 놓친 경우(5초 미만)는 직전 상태를 유지해 깜빡임을 막는다
        next = statusRef.current === 'idle' ? 'focused' : statusRef.current;
      } else {
        next = 'focused'; // 다시 정면을 보면 즉시 집중 상태로 복귀
      }
      updateStatus(next);

      // ---- 정면 맞추기(캘리브레이션): 3초 동안 정면 각도를 모아 평균을 기준값으로 저장 ----
      // 시간은 "실제로 분석된 첫 프레임"부터 잰다. 모델 첫 실행이 느린 기기에서
      // 3초가 프레임 몇 장 만에 지나가 버려 실패하던 문제를 막기 위함.
      // (now 는 분석 "시작" 시각이라 첫 분석이 몇 초 걸리면 그 시간이 통째로 들어간다 → 끝난 시각으로 잰다)
      const calib = calibRef.current;
      if (calib) {
        const doneAt = performance.now();
        calib.startedAt ??= doneAt;
        if (raw) calib.samples.push({ yaw: raw.yaw, pitch: raw.pitch });
        const elapsed = doneAt - calib.startedAt;
        const progress = Math.min(1, elapsed / CALIBRATION_MS);
        const enough = calib.samples.length >= CALIBRATION_MIN_SAMPLES;
        if (progress >= 1 && (enough || elapsed >= CALIBRATION_MAX_MS)) {
          calibRef.current = null;
          if (calib.samples.length >= 3) {
            const avg = (key) => calib.samples.reduce((sum, v) => sum + v[key], 0) / calib.samples.length;
            const saved = { yaw: avg('yaw'), pitch: avg('pitch'), savedAt: Date.now() };
            writeJSON(CALIBRATION_KEY, saved);
            baselineRef.current = saved;
            setBaseline(saved);
            setCalibration({ active: false, progress: 1, result: 'success' });
          } else {
            setCalibration({ active: false, progress: 0, result: 'fail' });
          }
        } else {
          setCalibration((c) => ({ ...c, progress }));
        }
      }

      // ---- 디버그 표시용 수치 (100ms 간격으로만 갱신) ----
      if (now - lastMetricsAtRef.current >= METRICS_INTERVAL_MS) {
        lastMetricsAtRef.current = now;
        setMetrics({
          face: hasFace,
          blinkL,
          blinkR,
          yaw,
          pitch,
          eyesClosedFor: eyesClosedSinceRef.current ? (now - eyesClosedSinceRef.current) / 1000 : 0,
          headAwayFor: headAwaySinceRef.current ? (now - headAwaySinceRef.current) / 1000 : 0,
          faceLostFor: hasFace ? 0 : lostFor / 1000,
          fps: fpsRef.current,
          delegate: delegateRef.current,
        });
      }
    },
    [updateStatus]
  );

  // ------------------------------------------------------------------
  // requestAnimationFrame 루프: 새 비디오 프레임이 있을 때만 분석
  // ------------------------------------------------------------------
  const loop = useCallback(() => {
    rafRef.current = requestAnimationFrame(loop);
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) return;
    if (video.currentTime === lastVideoTimeRef.current) return; // 같은 프레임은 건너뜀
    lastVideoTimeRef.current = video.currentTime;

    const now = performance.now();
    let result;
    try {
      result = landmarker.detectForVideo(video, now);
      errorCountRef.current = 0;
    } catch (err) {
      // 분석이 계속 실패하면 "집중 중"인 척하지 말고: GPU → CPU 전환 → 그래도 안 되면 오류 표시
      errorCountRef.current += 1;
      if (errorCountRef.current === 1) console.error('[FocusDetector] 프레임 분석 오류', err);
      if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS && !switchingRef.current) {
        if (delegateRef.current === 'GPU') {
          switchingRef.current = true;
          console.warn('[FocusDetector] GPU 분석이 계속 실패해 CPU로 전환합니다.');
          loadLandmarker('CPU')
            .then(({ landmarker: cpu, delegate }) => {
              landmarkerRef.current = cpu;
              delegateRef.current = delegate;
              errorCountRef.current = 0;
            })
            .catch((e) => failRef.current?.(e))
            .finally(() => {
              switchingRef.current = false;
            });
        } else {
          failRef.current?.(err);
        }
      }
      return;
    }

    // 초당 분석 횟수(FPS): 최근 1초 동안 분석한 프레임 수
    const times = frameTimesRef.current;
    times.push(now);
    while (times.length && now - times[0] > 1000) times.shift();
    fpsRef.current = times.length;

    analyze(result, now);
  }, [analyze]);

  // ------------------------------------------------------------------
  // 카메라 + 모델 시작
  // ------------------------------------------------------------------
  const start = useCallback(async () => {
    if (streamRef.current) return true; // 이미 실행 중
    if (startingRef.current) return startingRef.current; // 중복 호출 방지

    const run = (async () => {
      setErrorMessage('');
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('error');
        setErrorMessage('이 브라우저는 카메라를 지원하지 않거나, HTTPS가 아닌 주소에서 열렸어요.');
        return false;
      }

      // 1) 카메라 권한 요청
      setCameraState('requesting');
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch (err) {
        if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
          setCameraState('denied');
        } else {
          setCameraState('error');
          setErrorMessage(
            err?.name === 'NotFoundError'
              ? '연결된 카메라를 찾을 수 없어요.'
              : err?.name === 'NotReadableError'
                ? '다른 프로그램이 카메라를 사용 중이에요.'
                : `카메라를 켤 수 없어요. (${err?.name ?? '알 수 없는 오류'})`
          );
        }
        return false;
      }
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }

      // 2) 얼굴 인식 모델 로드
      setCameraState('loading');
      try {
        const { landmarker, delegate } = await loadLandmarker('GPU');
        landmarkerRef.current = landmarker;
        delegateRef.current = delegate;
        errorCountRef.current = 0;
        frameTimesRef.current = [];
      } catch (err) {
        console.error(err);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCameraState('error');
        setErrorMessage('얼굴 인식 모델을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.');
        return false;
      }

      // 3) 분석 루프 시작
      lastFaceSeenRef.current = performance.now();
      lastVideoTimeRef.current = -1;
      setCameraState('ready');
      updateStatus('focused');
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(loop);
      return true;
    })();

    startingRef.current = run;
    try {
      return await run;
    } finally {
      startingRef.current = null;
    }
  }, [loop, updateStatus]);

  // ------------------------------------------------------------------
  // 카메라 끄기
  // ------------------------------------------------------------------
  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    calibRef.current = null;
    eyesClosedSinceRef.current = null;
    headAwaySinceRef.current = null;
    setCalibration({ active: false, progress: 0, result: null });
    setCameraState('off');
    setMetrics(null);
    updateStatus('idle');
  }, [updateStatus]);

  // 분석이 GPU·CPU 모두에서 계속 실패할 때: 카메라를 끄고 이유를 화면에 보여준다
  failRef.current = (err) => {
    console.error('[FocusDetector] 얼굴 분석을 계속할 수 없습니다.', err);
    stop();
    setCameraState('error');
    setErrorMessage(`이 브라우저에서 얼굴 인식이 동작하지 않아요. 크롬 최신 버전에서 다시 시도해 주세요. (${err?.message ?? err})`);
  };

  // ------------------------------------------------------------------
  // 캘리브레이션: 3초간 정면을 보면 그 자세를 기준 각도로 저장
  // ------------------------------------------------------------------
  const calibrate = useCallback(async () => {
    const ok = await start();
    if (!ok) return;
    calibRef.current = { startedAt: null, samples: [] }; // 시작 시각은 첫 분석 프레임에서 정함
    setCalibration({ active: true, progress: 0, result: null });
  }, [start]);

  const resetCalibration = useCallback(() => {
    writeJSON(CALIBRATION_KEY, null);
    baselineRef.current = null;
    setBaseline(null);
  }, []);

  const dismissCalibrationResult = useCallback(() => {
    setCalibration((c) => ({ ...c, result: null }));
  }, []);

  // 컴포넌트가 사라질 때 카메라 정리
  useEffect(() => stop, [stop]);

  return {
    videoRef,
    cameraState,
    errorMessage,
    status,
    metrics,
    baseline,
    calibration,
    start,
    stop,
    calibrate,
    resetCalibration,
    dismissCalibrationResult,
  };
}
