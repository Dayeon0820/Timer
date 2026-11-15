// localStorage 기반 세션 기록 저장소
// 구조: { "2026-11-15": { focusSeconds, heldSeconds, drowsy, distracted, away, pomodoros,
//                         hours: { "15": { focusSeconds, heldSeconds, drowsy, ... }, ... } }, ... }
// - heldSeconds: 집중이 깨져서 타이머가 자동으로 멈춰 있던 시간 (집중도 계산용)

const HISTORY_KEY = 'focus-timer:history';

/** 로컬 시간 기준 YYYY-MM-DD 문자열 */
export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const EMPTY_DAY = { focusSeconds: 0, heldSeconds: 0, drowsy: 0, distracted: 0, away: 0, pomodoros: 0 };

/** JSON을 안전하게 읽기 (사생활 보호 모드 등에서 localStorage 가 막혀 있어도 앱이 죽지 않게) */
export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장 실패는 무시 */
  }
}

export function loadHistory() {
  return readJSON(HISTORY_KEY, {});
}

/**
 * 오늘 기록에 값을 더한다. 예: addToToday({ focusSeconds: 1 })
 * 같은 값을 현재 시각(0~23시) 칸(day.hours["15"])에도 더해서 시간대별 분석에 쓴다.
 */
export function addToToday(delta) {
  const history = loadHistory();
  const now = new Date();
  const key = dateKey(now);
  const hour = String(now.getHours());
  const day = { ...EMPTY_DAY, ...history[key] };
  const hours = { ...day.hours };
  const bucket = { ...hours[hour] };
  for (const [k, v] of Object.entries(delta)) {
    day[k] = (day[k] || 0) + v;
    bucket[k] = (bucket[k] || 0) + v;
  }
  hours[hour] = bucket;
  day.hours = hours;
  history[key] = day;
  writeJSON(HISTORY_KEY, history);
  // 같은 탭 안의 기록 화면이 바로 갱신되도록 이벤트 발행
  window.dispatchEvent(new Event('focus-history-change'));
}

/** 최근 N일 기록 배열 (오래된 날짜 → 오늘 순서) */
export function getRecentDays(n = 7) {
  const history = loadHistory();
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    days.push({ key, date: d, ...EMPTY_DAY, ...history[key] });
  }
  return days;
}

export function clearHistory() {
  writeJSON(HISTORY_KEY, {});
  window.dispatchEvent(new Event('focus-history-change'));
}

/** 연속 집중 일수: 오늘(오늘 기록이 없으면 어제)부터 거꾸로 집중 기록이 있는 날을 센다 */
export function getStreak() {
  const history = loadHistory();
  const d = new Date();
  const has = (date) => (history[dateKey(date)]?.focusSeconds ?? 0) > 0;
  if (!has(d)) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (has(d)) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
