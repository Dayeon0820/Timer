// 뽀모도로 타이머 훅
// - 실제 경과 시간(Date.now 차이)으로 계산해서 탭이 백그라운드여도 시간이 밀리지 않는다.
// - hold 가 true 이면(집중이 깨진 상태) 집중 구간에서만 자동으로 멈춘다.

import { useCallback, useEffect, useRef, useState } from 'react';

const TICK_MS = 250;

/**
 * @param {object} opts
 * @param {number} opts.focusMinutes  집중 시간(분)
 * @param {number} opts.breakMinutes  휴식 시간(분)
 * @param {boolean} opts.hold         true 면 집중 구간 타이머를 자동 일시정지
 * @param {(sec:number)=>void} opts.onFocusSeconds 실제로 집중한 시간이 1초 쌓일 때마다 호출
 * @param {(sec:number)=>void} opts.onHeldSeconds 집중이 깨져 자동 정지된 시간이 1초 쌓일 때마다 호출
 * @param {(phase:'focus'|'break')=>void} opts.onPhaseEnd 구간이 끝났을 때 호출
 */
export function usePomodoro({ focusMinutes, breakMinutes, hold, onFocusSeconds, onHeldSeconds, onPhaseEnd }) {
  const durationOf = useCallback(
    (p) => Math.round((p === 'focus' ? focusMinutes : breakMinutes) * 60 * 1000),
    [focusMinutes, breakMinutes]
  );

  const [phase, setPhase] = useState('focus'); // 'focus' | 'break'
  const [running, setRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(() => durationOf('focus'));

  // 인터벌 안에서 최신값을 읽기 위한 ref
  const remainingRef = useRef(remainingMs);
  const phaseRef = useRef(phase);
  const holdRef = useRef(hold);
  const lastTickRef = useRef(0);
  const focusCarryRef = useRef(0); // 1초 미만으로 쌓인 집중 시간
  const heldCarryRef = useRef(0); // 1초 미만으로 쌓인 자동 정지 시간
  const callbacksRef = useRef({ onFocusSeconds, onHeldSeconds, onPhaseEnd });

  holdRef.current = hold;
  callbacksRef.current = { onFocusSeconds, onHeldSeconds, onPhaseEnd };

  const setRemaining = (ms) => {
    remainingRef.current = ms;
    setRemainingMs(ms);
  };
  const setPhaseBoth = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // 메인 틱 루프
  useEffect(() => {
    if (!running) return undefined;
    lastTickRef.current = Date.now();

    const id = setInterval(() => {
      const now = Date.now();
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;

      const p = phaseRef.current;
      // 집중 구간에서 집중이 깨진 상태면 시간을 흘려보내지 않음 (자동 일시정지)
      // 대신 "멈춰 있던 시간"을 1초 단위로 알려준다 (시간대별 집중도 계산용)
      if (p === 'focus' && holdRef.current) {
        heldCarryRef.current += dt;
        const whole = Math.floor(heldCarryRef.current / 1000);
        if (whole > 0) {
          heldCarryRef.current -= whole * 1000;
          callbacksRef.current.onHeldSeconds?.(whole);
        }
        return;
      }

      // 집중 구간에서 실제로 흐른 시간 누적 → 1초 단위로 기록
      if (p === 'focus') {
        focusCarryRef.current += Math.min(dt, remainingRef.current);
        const whole = Math.floor(focusCarryRef.current / 1000);
        if (whole > 0) {
          focusCarryRef.current -= whole * 1000;
          callbacksRef.current.onFocusSeconds?.(whole);
        }
      }

      const next = remainingRef.current - dt;
      if (next > 0) {
        setRemaining(next);
        return;
      }

      // ---- 구간 종료 ----
      callbacksRef.current.onPhaseEnd?.(p);
      if (p === 'focus') {
        // 집중이 끝나면 휴식을 자동으로 시작
        setPhaseBoth('break');
        setRemaining(durationOf('break'));
      } else {
        // 휴식이 끝나면 다음 집중은 사용자가 직접 시작
        setPhaseBoth('focus');
        setRemaining(durationOf('focus'));
        setRunning(false);
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [running, durationOf]);

  // 멈춰 있을 때 설정에서 시간을 바꾸면 현재 구간 시간을 새 값으로 맞춤
  useEffect(() => {
    if (!running) setRemaining(durationOf(phaseRef.current));
    // running 이 바뀔 때는 실행하지 않도록 의존성에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationOf]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);

  const reset = useCallback(() => {
    setRunning(false);
    focusCarryRef.current = 0;
    setPhaseBoth('focus');
    setRemaining(durationOf('focus'));
  }, [durationOf]);

  /** 현재 구간을 건너뛰고 다음 구간으로 (멈춘 상태로 전환) */
  const skip = useCallback(() => {
    setRunning(false);
    const nextPhase = phaseRef.current === 'focus' ? 'break' : 'focus';
    setPhaseBoth(nextPhase);
    setRemaining(durationOf(nextPhase));
  }, [durationOf]);

  return {
    phase,
    running,
    remainingMs,
    totalMs: durationOf(phase),
    start,
    pause,
    reset,
    skip,
  };
}
