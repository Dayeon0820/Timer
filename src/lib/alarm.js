// Web Audio API로 경고음/알림음을 직접 생성 (음원 파일 없음)

let ctx = null;

/** 브라우저 자동재생 정책 때문에, 사용자 클릭 시점에 한 번 호출해 오디오를 깨워둔다 */
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

/** 단일 비프음 재생 */
function beep({ freq = 880, start = 0, duration = 0.18, type = 'sine', volume = 0.25 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  // 딸깍 소리를 막기 위해 볼륨을 부드럽게 올렸다 내림
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** 집중이 깨졌을 때: 짧은 두 번의 높은 경고음 */
export function playWarning() {
  unlockAudio();
  beep({ freq: 880, start: 0, type: 'square', volume: 0.12 });
  beep({ freq: 660, start: 0.22, type: 'square', volume: 0.12 });
}

/** 집중/휴식 구간이 끝났을 때: 부드러운 상승 3음 */
export function playChime() {
  unlockAudio();
  [523.25, 659.25, 783.99].forEach((f, i) =>
    beep({ freq: f, start: i * 0.18, duration: 0.35, volume: 0.2 })
  );
}

/** 3단계(계속 졸 때): 더 크고 빠른 상승 알람 */
export function playAlarm() {
  unlockAudio();
  [660, 880, 1100].forEach((f, i) => beep({ freq: f, start: i * 0.14, duration: 0.12, type: 'square', volume: 0.2 }));
}
