// 시간대별 집중 분석 (순수 함수 - React 와 분리해서 테스트하기 쉽게)
//
// 집중도(%) = 집중한 시간 ÷ (집중한 시간 + 집중이 깨져 멈춰 있던 시간)
// 예) 오후 3시에 40분 집중, 10분 멈춤 → 80%

const MIN_SECONDS_FOR_RATE = 10 * 60; // 데이터가 10분 이상 쌓인 시간대만 집중도 순위에 포함

/** 0~23 → "오전 9시" / "오후 3시" / "밤 12시" / "낮 12시" */
export function formatHour(h) {
  if (h === 0) return '밤 12시';
  if (h === 12) return '낮 12시';
  return h < 12 ? `오전 ${h}시` : `오후 ${h - 12}시`;
}

/** 여러 날의 기록을 0~23시 24칸으로 합친다 */
export function aggregateHours(days) {
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    focusSeconds: 0,
    heldSeconds: 0,
    drowsy: 0,
    distracted: 0,
    away: 0,
  }));
  for (const day of days) {
    for (const [h, b] of Object.entries(day.hours ?? {})) {
      const slot = hours[Number(h)];
      if (!slot) continue;
      for (const k of ['focusSeconds', 'heldSeconds', 'drowsy', 'distracted', 'away']) slot[k] += b[k] ?? 0;
    }
  }
  for (const slot of hours) {
    const total = slot.focusSeconds + slot.heldSeconds;
    slot.total = total;
    slot.focusRate = total > 0 ? slot.focusSeconds / total : null; // 0~1, 데이터 없으면 null
  }
  return hours;
}

/** 가장 큰 값을 가진 시간대 (값이 min 미만이면 null) */
function maxBy(hours, pick, min = 1) {
  let best = null;
  for (const h of hours) {
    const v = pick(h);
    if (v >= min && (best === null || v > pick(best))) best = h;
  }
  return best;
}

/**
 * 분석 문장 만들기
 * @returns {{ id, tone, mood, title, detail, hour }[]}
 */
export function getInsights(hours) {
  const insights = [];

  // 1) 집중이 가장 잘 되는 시간 (충분한 데이터가 있는 시간대 중 집중도 최고)
  const rated = hours.filter((h) => h.total >= MIN_SECONDS_FOR_RATE);
  const best = rated.length
    ? rated.reduce((a, b) => (b.focusRate > a.focusRate || (b.focusRate === a.focusRate && b.focusSeconds > a.focusSeconds) ? b : a))
    : maxBy(hours, (h) => h.focusSeconds, 60);
  if (best) {
    insights.push({
      id: 'best',
      tone: 'good',
      mood: 'happy',
      hour: best.hour,
      title: `${formatHour(best.hour)}에 집중이 가장 잘 돼요`,
      detail: rated.length
        ? `집중도 ${Math.round(best.focusRate * 100)}% · 중요한 공부는 이 시간에 해보세요`
        : `이 시간에 가장 오래 집중했어요 (${Math.round(best.focusSeconds / 60)}분)`,
    });
  }

  // 2) 가장 많이 조는 시간
  const drowsy = maxBy(hours, (h) => h.drowsy);
  if (drowsy) {
    insights.push({
      id: 'drowsy',
      tone: 'warn',
      mood: 'sleepy',
      hour: drowsy.hour,
      title: `나는 ${formatHour(drowsy.hour)}에 제일 많이 졸아요`,
      detail: `졸음 ${drowsy.drowsy}회 · 이 시간 전에 가볍게 걷거나 물을 마셔 보세요`,
    });
  }

  // 3) 딴짓이 가장 많은 시간
  const distracted = maxBy(hours, (h) => h.distracted);
  if (distracted) {
    insights.push({
      id: 'distracted',
      tone: 'warn',
      mood: 'surprised',
      hour: distracted.hour,
      title: `${formatHour(distracted.hour)}에 딴짓이 가장 많아요`,
      detail: `딴짓 ${distracted.distracted}회 · 이 시간엔 휴대폰을 멀리 두면 좋아요`,
    });
  }

  return insights;
}
