// 세션 기록을 구독하는 훅: 타이머가 기록을 저장할 때마다 자동으로 다시 읽는다.
import { useEffect, useState } from 'react';
import { getRecentDays, getStreak } from '../lib/storage';

export function useHistory(days = 7) {
  const read = () => ({ days: getRecentDays(days), streak: getStreak() });
  const [data, setData] = useState(read);

  useEffect(() => {
    const refresh = () => setData(read());
    window.addEventListener('focus-history-change', refresh);
    window.addEventListener('storage', refresh); // 다른 탭에서 바뀐 경우
    return () => {
      window.removeEventListener('focus-history-change', refresh);
      window.removeEventListener('storage', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  return data;
}

/** 초 → { h, m } */
export function splitDuration(sec) {
  const m = Math.floor(sec / 60);
  return { h: Math.floor(m / 60), m: m % 60 };
}

/** 초 → "1시간 23분" */
export function formatDuration(sec) {
  const { h, m } = splitDuration(sec);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}
