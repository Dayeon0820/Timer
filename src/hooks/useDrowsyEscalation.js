// 졸음 단계별 대응 훅
//   1단계: 화면 깜빡임 (졸음 감지 즉시)
//   2단계: 경고음 반복 (4초 더 졸거나, 10분 안에 두 번째 졸음)
//   3단계: 스트레칭 미션 (10초 더 졸거나, 10분 안에 세 번째 졸음)
// 단계 대응을 끄면 예전처럼 졸음 감지 즉시 경고음(2단계)만 울린다.
import { useEffect, useRef, useState } from 'react';
import { ESCALATION } from '../lib/defaults';
import { playAlarm, playWarning } from '../lib/alarm';

/**
 * @param {object} o
 * @param {boolean} o.drowsyActive  타이머 집중 구간에서 졸음 상태인지
 * @param {boolean} o.enabled       단계별 대응 사용 여부
 * @param {boolean} o.missionEnabled 3단계에서 스트레칭 미션 사용 여부
 * @param {boolean} o.soundEnabled  경고음 사용 여부
 * @param {boolean} o.missionOpen   미션 진행 중인지 (App 이 상태를 가짐)
 * @param {() => void} o.onMission  3단계 도달 시 미션 열기
 * @returns {number} 현재 단계 (0 = 졸음 아님)
 */
export function useDrowsyEscalation({ drowsyActive, enabled, missionEnabled, soundEnabled, missionOpen, onMission }) {
  const [level, setLevel] = useState(0);
  const episodesRef = useRef([]); // 최근 졸음 시작 시각들
  const soundRef = useRef(soundEnabled);
  const onMissionRef = useRef(onMission);
  soundRef.current = soundEnabled;
  onMissionRef.current = onMission;

  const active = drowsyActive && !missionOpen; // 미션 중에는 단계 판정을 멈춘다

  // 졸음이 시작될 때 시작 단계를 정하고, 계속되면 시간에 따라 단계를 올린다
  useEffect(() => {
    if (!active) {
      setLevel(0);
      return undefined;
    }
    if (!enabled) {
      setLevel(2); // 단계 대응 끔 → 바로 경고음
      return undefined;
    }
    const now = Date.now();
    episodesRef.current = [...episodesRef.current.filter((t) => now - t < ESCALATION.windowMs), now];
    const startLevel = Math.min(3, episodesRef.current.length); // 10분 안에 n번째 졸음 → n단계부터
    setLevel(startLevel);

    const timers = [];
    if (startLevel < 2) timers.push(setTimeout(() => setLevel((l) => Math.max(l, 2)), ESCALATION.level2AfterMs));
    if (startLevel < 3) timers.push(setTimeout(() => setLevel(3), ESCALATION.level3AfterMs));
    return () => timers.forEach(clearTimeout);
  }, [active, enabled]);

  // 3단계 도달 → 스트레칭 미션
  useEffect(() => {
    if (level >= 3 && enabled && missionEnabled) {
      episodesRef.current = []; // 미션을 마치면 다음 졸음은 다시 1단계부터
      onMissionRef.current?.();
    }
  }, [level, enabled, missionEnabled]);

  // 2단계 이상 → 경고음 반복 (3단계는 더 강하고 빠르게)
  useEffect(() => {
    if (level < 2 || missionOpen) return undefined;
    const play = level >= 3 ? playAlarm : playWarning;
    if (soundRef.current) play();
    const id = setInterval(() => soundRef.current && play(), level >= 3 ? 2500 : 4000);
    return () => clearInterval(id);
  }, [level, missionOpen]);

  return level;
}
